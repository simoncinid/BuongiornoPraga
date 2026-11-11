import { PrismaClient, Prisma } from "@prisma/client";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { tours } from "../data";
import type { PlatformState } from "./model";
const runtime = globalThis as unknown as {
  platformPrisma?: PrismaClient;
  platformQueue?: Promise<unknown>;
};
export function database() {
  return (runtime.platformPrisma ??= new PrismaClient());
}
export function hasProductionDatabase() {
  const url = process.env.DATABASE_URL || "";
  // Evita che un .env locale (localhost) finisca su Vercel e rompa la produzione.
  return Boolean(url) && !/localhost|127\.0\.0\.1/i.test(url);
}
export function localMode() {
  return (
    process.env.PLATFORM_STORAGE === "local" ||
    (!hasProductionDatabase() && process.env.NODE_ENV !== "production")
  );
}
export function initialState(): PlatformState {
  return {
    version: 1,
    tours: structuredClone(tours).map((t) => ({
      ...t,
      published: true,
      adultMinAge: 12,
      childMinAge: 4,
      bookingCutoffHours: 2,
      guide: "",
      slots: t.slots.map((s) => ({ ...s, reserved: 0 })),
    })),
    bookings: [],
    orders: [],
    jobs: [],
    affiliates: [],
    pages: {},
    ota: [],
    inquiries: [],
    audit: [],
    events: [],
    rateLimits: {},
    settings: {
      multiTourPercent: 10,
      minimumTours: 2,
      cancellationHours: 24,
      lateRefundPercent: 0,
      retentionDays: 730,
      emailFooter: "FreeTourPraga · Assistenza tutti i giorni 9:00–19:00",
      reminderHours: 24,
      googleAdsId: "",
      googleAdsLabel: "",
    },
  };
}
const file = () =>
  resolve(process.env.PLATFORM_DATA_FILE || ".data/platform.json");
async function readLocal() {
  try {
    return JSON.parse(await readFile(file(), "utf8")) as PlatformState;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    return initialState();
  }
}
// All mutations, including inventory, outbox and deduplication, commit together.
// PostgreSQL row lock serializes requests across Vercel instances and workers.
export async function transaction<T>(
  work: (state: PlatformState) => T | Promise<T>,
): Promise<T> {
  if (localMode()) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Archivio locale vietato in produzione");
    const pending = (runtime.platformQueue ?? Promise.resolve()).then(
      async () => {
        const state = await readLocal();
        const result = await work(state);
        await mkdir(dirname(file()), { recursive: true });
        const temp = `${file()}.${randomUUID()}.tmp`;
        await writeFile(temp, JSON.stringify(state), { mode: 0o600 });
        await rename(temp, file());
        return result;
      },
    );
    runtime.platformQueue = pending.catch(() => {});
    return pending;
  }
  if (!hasProductionDatabase()) throw new Error("DATABASE_URL richiesta");
  const db = database();
  await db.platformState.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      data: initialState() as unknown as Prisma.InputJsonValue,
    },
    update: {},
  });
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "PlatformState" WHERE id = 'main' FOR UPDATE`;
      const row = await tx.platformState.findUniqueOrThrow({
        where: { id: "main" },
      });
      const state = row.data as unknown as PlatformState;
      const result = await work(state);
      await tx.platformState.update({
        where: { id: "main" },
        data: { data: state as unknown as Prisma.InputJsonValue },
      });
      return result;
    },
    { maxWait: 15000, timeout: 15000 },
  );
}
export async function readState(): Promise<PlatformState> {
  if (localMode()) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Archivio locale vietato in produzione");
    return readLocal();
  }
  // Anteprima Vercel senza Postgres reale: pagine pubbliche con seed, nessuna scrittura.
  if (!hasProductionDatabase()) return initialState();
  const row = await database().platformState.findUnique({
    where: { id: "main" },
  });
  return row ? (row.data as unknown as PlatformState) : initialState();
}
export function audit(
  s: PlatformState,
  actor: string,
  action: string,
  target: string,
) {
  s.audit.unshift({
    id: randomUUID(),
    actor,
    action,
    target,
    at: new Date().toISOString(),
  });
  s.audit = s.audit.slice(0, 10000);
}
