import { transaction } from "./store";
import { audit } from "./store";
export async function maintainPrivacy() {
  return transaction((s) => {
    const now = Date.now();
    let cleaned = 0;
    for (const b of s.bookings) {
      const tour = s.tours.find((t) => t.slug === b.tourSlug);
      const at =
        tour?.slots.find((x) => x.id === b.slotId)?.startsAt || b.createdAt;
      if (
        now - new Date(at).getTime() > s.settings.retentionDays * 86400000 &&
        b.email !== "removed@invalid.local"
      ) {
        b.name = "Dati rimossi";
        b.email = "removed@invalid.local";
        b.phone = "";
        b.notes = "";
        b.tokenHash = "";
        b.cancellationReason =
          b.status === "cancelled" ? "Dati rimossi" : undefined;
        b.whatsappConsent = false;
        for (const job of s.jobs.filter((j) => j.bookingPnr === b.pnr)) {
          job.to = "";
          job.text = "Dati rimossi";
          job.error = undefined;
          if (job.status !== "sent") job.status = "failed";
        }
        cleaned++;
      }
    }
    for (const o of s.orders) {
      if (
        o.pnrs.every(
          (p) =>
            s.bookings.find((b) => b.pnr === p)?.email ===
            "removed@invalid.local",
        )
      ) {
        o.token = "";
        o.fingerprint = "";
      }
    }
    for (const m of s.ota)
      if (now - new Date(m.createdAt).getTime() > 30 * 86400000)
        m.raw = "Contenuto rimosso per conservazione dati";
    for (const i of s.inquiries)
      if (now - new Date(i.createdAt).getTime() > 180 * 86400000) {
        i.name = "Dati rimossi";
        i.email = "removed@invalid.local";
        i.message = "Dati rimossi";
      }
    if (cleaned) audit(s, "system", "privacy.clean", String(cleaned));
    return { cleaned };
  });
}
