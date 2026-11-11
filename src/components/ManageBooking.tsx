"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { managedBooking } from "@/lib/platform/booking";
import { formatMoney } from "@/lib/format";
type Booking = Awaited<ReturnType<typeof managedBooking>>;
const date = (value: string) =>
  new Date(value).toLocaleString("it-IT", {
    timeZone: "Europe/Prague",
    dateStyle: "full",
    timeStyle: "short",
  });
export function ManageBooking({ pnr, proof }: { pnr: string; proof: string }) {
  const [booking, setBooking] = useState<Booking | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [slot, setSlot] = useState("");
  async function send(action = "view", fields: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/platform/manage/${encodeURIComponent(pnr)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof, action, ...fields }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setBooking(d);
      setSlot(d.slotId);
      if (action !== "view")
        setMessage(
          action === "cancel"
            ? "Prenotazione cancellata. Riceverai la comunicazione aggiornata via email."
            : action === "move"
              ? "Partenza aggiornata. Riceverai la nuova conferma via email."
              : "Preferenze aggiornate.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connessione non disponibile.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    send();
  }, [pnr, proof]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <p className="micro-label text-primary">La tua prenotazione · {pnr}</p>
        <h1 className="display-xl my-5">Organizza la tua visita.</h1>
        <p className="mb-6">
          Da questo link puoi gestire esclusivamente questa prenotazione, senza
          registrazione.
        </p>
        {error && (
          <p role="alert" className="card mb-5 p-5 text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="card mb-5 p-5">
            {message}
          </p>
        )}
        {!booking && !error && <p role="status">Caricamento…</p>}
        {booking && (
          <>
            <article className="card mb-6 grid gap-4 p-6">
              <span className="status-chip">
                {
                  {
                    confirmed: "Confermata",
                    pending: "Pagamento da completare",
                    cancelled: "Cancellata",
                    present: "Partecipazione registrata",
                    no_show: "Assente",
                  }[booking.status]
                }
              </span>
              <h2 className="display-md">{booking.tourTitle}</h2>
              <p>{date(booking.startsAt)} · ora di Praga</p>
              <p>
                {booking.totalGuests} partecipanti ·{" "}
                {formatMoney(booking.totalCents)} ·{" "}
                {booking.paymentStatus === "paid"
                  ? "Pagato"
                  : booking.paymentStatus === "refunded"
                    ? "Rimborsato"
                    : booking.paymentMethod === "cash"
                      ? "Contanti sul posto"
                      : booking.paymentMethod === "ota"
                        ? "Pagamento gestito dal provider"
                        : "Pagamento online in attesa"}
              </p>
              <p>
                {booking.meetingPoint}
                <br />
                {booking.meetingAddress}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="button-secondary"
                  href={booking.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apri la mappa
                </a>
                <a className="button-secondary" href={booking.calendarUrl}>
                  Aggiungi al calendario
                </a>
              </div>
              {booking.paymentUrl && (
                <a className="button-primary" href={booking.paymentUrl}>
                  Paga l’ordine · {formatMoney(booking.paymentAmountCents)}
                </a>
              )}
              {booking.status === "cancelled" && (
                <p>
                  {booking.cancellationReason}
                  {booking.refundCents
                    ? ` · Rimborso previsto: ${formatMoney(booking.refundCents)} · stato: ${booking.refundStatus === "succeeded" ? "completato" : booking.refundStatus === "manual" ? "in gestione allo staff" : "in elaborazione"}`
                    : ""}
                </p>
              )}
            </article>
            {booking.canMove && (
              <form
                className="card mb-6 grid gap-4 p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  send("move", { slotId: slot });
                }}
              >
                <h2 className="display-md">Cambia data o orario</h2>
                <p className="text-sm">
                  Puoi cambiare partenza su questo tour fino a{" "}
                  {booking.cancellationHours} ore prima, a parità di
                  partecipanti e in base alla disponibilità.
                </p>
                <label>
                  Nuova partenza
                  <select
                    className="text-input"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                  >
                    {booking.slots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {date(s.startsAt)}
                        {s.id === booking.slotId
                          ? " · partenza attuale"
                          : ` · ${s.available} posti disponibili`}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  disabled={busy || slot === booking.slotId}
                  className="button-secondary"
                >
                  Conferma nuova partenza
                </button>
              </form>
            )}
            {booking.canCancel && (
              <details className="card mb-6 p-6">
                <summary className="cursor-pointer font-bold">
                  Cancella questa prenotazione
                </summary>
                <form
                  className="mt-5 grid gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send("cancel", {
                      reason: new FormData(e.currentTarget).get("reason"),
                    });
                  }}
                >
                  <p>
                    {booking.paymentStatus === "paid"
                      ? `Rimborso previsto secondo le condizioni accettate: ${formatMoney(booking.refundPreviewCents)}.`
                      : "Non ci sono pagamenti registrati da rimborsare."}{" "}
                    I posti saranno liberati dopo la conferma.
                  </p>
                  <label>
                    Motivo della cancellazione
                    <textarea
                      className="text-input"
                      name="reason"
                      minLength={2}
                      maxLength={1000}
                      required
                    />
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" required />
                    Confermo di voler cancellare questa prenotazione.
                  </label>
                  <button disabled={busy} className="button-secondary">
                    Conferma cancellazione
                  </button>
                </form>
              </details>
            )}
            {booking.status !== "cancelled" && (
              <label className="card mb-6 flex items-start gap-3 p-6 text-sm">
                <input
                  type="checkbox"
                  disabled={busy}
                  checked={booking.whatsappConsent}
                  onChange={(e) =>
                    send("consent", { consent: e.target.checked })
                  }
                />
                Desidero il promemoria di questo tour su WhatsApp.
              </label>
            )}
          </>
        )}
        <Link href="/contatti" className="button-secondary">
          Contatta il team
        </Link>
      </div>
    </section>
  );
}
