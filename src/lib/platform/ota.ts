import { randomUUID } from "node:crypto";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { z } from "zod";
import { audit, readState, transaction } from "./store";
import { createOrder, notification } from "./booking";
import { checkoutSchema } from "./validation";
import { pragueLocal } from "./time";
import type { PlatformState } from "./model";
import { hash, HttpError } from "./security";
export const otaSchema = z.object({
  provider: z.enum(["civitatis", "getyourguide"]),
  reference: z.string().min(2).max(100),
  raw: z.string().min(10).max(100000),
});
// Conservative parsers: only structured, unambiguous fields are imported automatically.
// Unknown layouts remain in the review queue; no inference of customer/slot data.
const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
function field(raw: string, labels: string[]) {
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([^:]+):\s*(.+)$/);
    if (match && labels.some((x) => normalize(match[1]) === normalize(x)))
      return match[2].trim();
  }
  return "";
}
export function providerReference(raw: string) {
  return field(raw, [
    "Booking reference",
    "Booking number",
    "Reservation number",
    "Numero prenotazione",
    "Codice prenotazione",
    "Numero de reserva",
    "Referencia",
    "BOOKING_ID",
  ]);
}
export function parseOta(raw: string, state?: PlatformState) {
  const fields: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+):\s*(.+)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  if (!fields.TOUR_SLUG && state) {
    const activity = field(raw, [
      "Activity",
      "Activity name",
      "Tour",
      "Tour name",
      "Attivita",
      "Actividad",
      "Nombre de la actividad",
      "Product ID",
    ]);
    const tour = state.tours.find((t) =>
      [t.title, t.slug, ...(t.otaAliases || [])].some(
        (alias) => normalize(alias) === normalize(activity),
      ),
    );
    if (tour) {
      fields.TOUR_SLUG = tour.slug;
      let date = field(raw, [
        "Date",
        "Tour date",
        "Activity date",
        "Data",
        "Fecha",
        "Fecha de la actividad",
      ]);
      const european = date.match(/^(\d{2})[/.](\d{2})[/.](\d{4})$/);
      if (european) date = `${european[3]}-${european[2]}-${european[1]}`;
      const hour = field(raw, ["Time", "Start time", "Orario", "Hora"]).match(
        /^(\d{1,2}):(\d{2})(?:\s*h)?$/,
      );
      const local = hour
        ? `${date}T${hour[1].padStart(2, "0")}:${hour[2]}`
        : "";
      fields.SLOT_ID =
        tour.slots.find((s) => pragueLocal(s.startsAt) === local)?.id || "";
    }
  }
  return checkoutSchema.parse({
    name:
      fields.CUSTOMER ||
      field(raw, [
        "Customer",
        "Customer name",
        "Lead traveler",
        "Traveler name",
        "Nome cliente",
        "Nombre del cliente",
        "Nombre",
      ]),
    email:
      fields.EMAIL ||
      field(raw, ["Email", "Email address", "E-mail", "Correo electronico"]),
    phone:
      fields.PHONE ||
      field(raw, ["Phone", "Phone number", "Telefono", "Numero de telefono"]),
    items: [
      {
        tourSlug: fields.TOUR_SLUG,
        slotId: fields.SLOT_ID,
        adults: Number(
          fields.ADULTS ||
            fields.GUESTS ||
            field(raw, [
              "Adults",
              "Adulti",
              "Adultos",
              "Participants",
              "Participantes",
              "Partecipanti",
            ]),
        ),
        children: Number(
          fields.CHILDREN || field(raw, ["Children", "Bambini", "Ninos"]) || 0,
        ),
        infants: Number(
          fields.INFANTS || field(raw, ["Infants", "Infanti", "Bebes"]) || 0,
        ),
      },
    ],
    paymentMethod: "cash",
    termsAccepted: true,
    whatsappConsent: false,
    notes: "Importazione OTA: verificare pagamento sul provider",
  });
}
export async function ingestOta(input: z.infer<typeof otaSchema>) {
  const canonicalReference = providerReference(input.raw);
  if (canonicalReference) input = { ...input, reference: canonicalReference };
  const message = await transaction((s) => {
    const existing = s.ota.find(
      (m) => m.provider === input.provider && m.reference === input.reference,
    );
    if (
      existing?.status === "imported" &&
      hash(existing.raw) !== hash(input.raw)
    ) {
      const reference = `${input.reference}:follow:${hash(input.raw).slice(0, 12)}`;
      const previous = s.ota.find(
        (m) => m.provider === input.provider && m.reference === reference,
      );
      if (previous) return { ...previous, followup: true };
      const update = {
        ...input,
        reference,
        id: randomUUID(),
        status: "review" as const,
        pnr: existing.pnr,
        error:
          "Comunicazione successiva: verifica e aggiorna la prenotazione esistente.",
        createdAt: new Date().toISOString(),
      };
      s.ota.push(update);
      return { ...update, followup: true };
    }
    if (existing) return { ...existing };
    const m = {
      ...input,
      id: randomUUID(),
      status: "review" as const,
      createdAt: new Date().toISOString(),
    };
    s.ota.push(m);
    return { ...m };
  });
  if (message.status === "imported" || "followup" in message) return message;
  try {
    const parsed = parseOta(input.raw, await readState());
    return await approveOta(message.id, parsed);
  } catch (e) {
    await transaction((s) => {
      const m = s.ota.find((m) => m.id === message.id)!;
      m.error =
        e instanceof z.ZodError
          ? "Formato non riconosciuto: verifica e completa i campi prima di importare."
          : e instanceof Error
            ? e.message
            : "Da verificare";
    });
    return { ...message, status: "review" };
  }
}
export async function approveOta(
  id: string,
  input: z.infer<typeof checkoutSchema>,
) {
  const s = await readState();
  const message = s.ota.find((m) => m.id === id);
  if (!message) throw new HttpError(404, "Email non trovata");
  if (message.status === "imported") return message;
  if (message.pnr)
    throw new HttpError(
      409,
      "Aggiorna la prenotazione esistente e chiudi la revisione.",
    );
  const order = await createOrder(
    { ...input, paymentMethod: "cash" },
    `ota:${message.provider}:${message.reference}`,
    message.provider,
  );
  return transaction((s) => {
    const m = s.ota.find((m) => m.id === id)!;
    if (m.status === "imported") return { ...m };
    m.status = "imported";
    m.pnr = order.pnrs[0];
    m.error = undefined;
    for (const b of s.bookings.filter((b) => b.orderId === order.id)) {
      b.paymentMethod = "ota";
      b.paymentStatus =
        /^(?:PAYMENT_STATUS|Payment status|Estado del pago):\s*(?:paid|pagato|pagado)\s*$/im.test(
          m.raw,
        )
          ? "paid"
          : "pending";
      const total = m.raw.match(
        /^(?:TOTAL_EUR|Total EUR):\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*$/im,
      );
      const amount = total
        ? Math.round(Number(total[1].replace(",", ".")) * 100)
        : undefined;
      if (
        amount !== undefined &&
        Number.isSafeInteger(amount) &&
        amount >= 0 &&
        amount <= 100000000
      ) {
        b.subtotalCents = amount;
        b.discountCents = 0;
        b.totalCents = amount;
        const o = s.orders.find((o) => o.id === order.id)!;
        o.totalCents = amount;
      }
      notification(s, b, "Confermata dal provider");
    }
    audit(s, "ota", "ota.import", m.id);
    return { ...m };
  });
}
export async function pollMailbox() {
  if (
    !process.env.IMAP_HOST ||
    !process.env.IMAP_USER ||
    !process.env.IMAP_PASSWORD
  )
    return { configured: false, processed: 0 };
  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: { user: process.env.IMAP_USER, pass: process.env.IMAP_PASSWORD },
    logger: false,
  });
  const allowed = (process.env.OTA_ALLOWED_SENDERS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length)
    throw new HttpError(503, "Configurare OTA_ALLOWED_SENDERS");
  let processed = 0;
  await client.connect();
  try {
    const lock = await client.getMailboxLock(
      process.env.IMAP_FOLDER || "INBOX",
    );
    try {
      const ids = await client.search(
        { seen: false, or: allowed.map((from) => ({ from })) },
        { uid: true },
      );
      if (ids)
        for (const uid of ids.slice(0, 10)) {
          const info = await client.fetchOne(
            uid,
            { size: true },
            { uid: true },
          );
          if (!info || (info.size || 0) > 200000) continue;
          const mail = await client.fetchOne(
            uid,
            { source: true },
            { uid: true },
          );
          if (!mail || !mail.source) continue;
          const parsed = await simpleParser(mail.source);
          const from = parsed.from?.value[0]?.address?.toLowerCase() || "";
          if (!allowed.includes(from)) continue;
          const provider = from.includes("civitatis")
            ? "civitatis"
            : from.includes("getyourguide")
              ? "getyourguide"
              : null;
          if (!provider) continue;
          // Sender allowlist + DKIM result from the trusted inbound mail server are required.
          const auth = String(
            parsed.headers.get("authentication-results") || "",
          );
          if (!verifiedDkim(auth, from)) continue;
          await ingestOta({
            provider,
            reference: parsed.messageId || hash(mail.source.toString()),
            raw: parsed.text || "",
          });
          await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
          processed++;
        }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
  return { configured: true, processed };
}

export function verifiedDkim(auth: string, from: string) {
  const domain = from.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return auth.split(";").some((part) => {
    if (!/\bdkim=pass\b/i.test(part)) return false;
    const matches = [
      ...part.matchAll(/header\.(?:d|i)\s*=\s*(?:[^\s@;]+@|@)?([a-z0-9.-]+)/gi),
    ];
    return matches.some(
      (m) =>
        m[1].toLowerCase() === domain ||
        m[1].toLowerCase().endsWith("." + domain),
    );
  });
}
