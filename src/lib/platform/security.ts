import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { transaction } from "./store";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const secretToken = () => randomBytes(32).toString("base64url");
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production")
      throw new HttpError(
        503,
        "Configurare SESSION_SECRET (almeno 32 caratteri)",
      );
    return "local-only-secret-please-configure-production";
  }
  return s;
}
function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}
export function constantEqual(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export type Session = {
  email: string;
  role: "admin" | "operator" | "guide";
  expires: number;
};
export function sessionToken(email: string, role: Session["role"]) {
  const payload = Buffer.from(
    JSON.stringify({ email, role, expires: Date.now() + 8 * 3600000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export async function session(): Promise<Session | null> {
  const token = (await cookies()).get("ftp_session")?.value;
  if (!token) return null;
  try {
    const [p, s] = token.split(".");
    if (!constantEqual(sign(p), s)) return null;
    const data = JSON.parse(Buffer.from(p, "base64url").toString()) as Session;
    const users = JSON.parse(process.env.STAFF_USERS || "[]") as {
      email: string;
      role: string;
    }[];
    return data.expires > Date.now() &&
      users.some((u) => u.email === data.email && u.role === data.role)
      ? data
      : null;
  } catch {
    return null;
  }
}
export async function requireStaff(
  roles: Session["role"][] = ["admin", "operator"],
) {
  const s = await session();
  if (!s) throw new HttpError(401, "Accedi con un account autorizzato");
  if (!roles.includes(s.role))
    throw new HttpError(403, "Permessi insufficienti per questa operazione");
  return s;
}
export function checkPassword(password: string, encoded: string) {
  try {
    const [salt, key] = encoded.split(":");
    return constantEqual(scryptSync(password, salt, 64).toString("hex"), key);
  } catch {
    return false;
  }
}
export function checkOrigin(request: Request) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url)
      .origin;
    if (origin && origin !== expected)
      throw new HttpError(403, "Origine non autorizzata");
  }
}
export async function rateLimit(request: Request, bucket: string, max = 30) {
  // In production trust only headers supplied and overwritten by the hosting proxy.
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "local";
  await transaction((s) => {
    const now = Date.now();
    for (const [k, v] of Object.entries(s.rateLimits))
      if (v.resetAt < now) delete s.rateLimits[k];
    const key = hash(`${bucket}:${ip}`);
    const r = (s.rateLimits[key] ??= { count: 0, resetAt: now + 60000 });
    if (++r.count > max)
      throw new HttpError(429, "Troppe richieste. Riprova tra un minuto.");
  });
}
export function bearer(request: Request, envName: string) {
  const expected = process.env[envName];
  if (
    !expected ||
    !constantEqual(
      request.headers.get("authorization") || "",
      `Bearer ${expected}`,
    )
  )
    throw new HttpError(401, "Credenziale servizio non valida");
}
export async function jsonBody(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 200000)
    throw new HttpError(413, "Richiesta troppo grande");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Corpo richiesta assente");
  let total = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 200000) {
      await reader.cancel();
      throw new HttpError(413, "Richiesta troppo grande");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "JSON non valido");
  }
}

// Separate proof for one booking only; does not grant access to the whole order.
export function bookingManagementProof(id: string, pnr: string) {
  const key = process.env.BOOKING_LINK_SECRET || secret();
  if (key.length < 32)
    throw new HttpError(
      503,
      "Configurare una chiave sicura per i link prenotazione",
    );
  return createHmac("sha256", key)
    .update(`booking-management:${id}:${pnr}`)
    .digest("base64url");
}
export function verifyBookingManagementProof(
  proof: string,
  id: string,
  pnr: string,
) {
  return (
    typeof proof === "string" &&
    proof.length === 43 &&
    constantEqual(proof, bookingManagementProof(id, pnr))
  );
}
