"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { trackPurchase } from "./ConsentAndTracking";
import type { orderConfirmation } from "@/lib/platform/booking";
type Receipt = Awaited<ReturnType<typeof orderConfirmation>>;
export function BookingConfirmation() {
  const [receipt, setReceipt] = useState<Receipt | null>(null),
    [proof, setProof] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    let cancelled = false,
      timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    async function load() {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("ftp-checkout-receipt") || "null",
        );
        if (!saved?.proof) {
          setMessage(
            "Trovi il riepilogo e l’esito della prenotazione nella conferma inviata via email.",
          );
          return;
        }
        const r = await fetch("/api/platform/confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proof: saved.proof }),
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (cancelled) return;
        setReceipt(d);
        setProof(saved.proof);
        if (
          d.bookings.every(
            (b: Receipt["bookings"][number]) => b.status === "confirmed",
          )
        )
          trackPurchase(d.order, d.settings);
        if (
          d.bookings.some(
            (b: Receipt["bookings"][number]) => b.status === "pending",
          ) &&
          attempts++ < 120
        )
          timer = setTimeout(load, 5000);
      } catch (e) {
        if (!cancelled)
          setMessage(
            e instanceof Error
              ? e.message
              : "Connessione non disponibile. Consulta la conferma email.",
          );
      }
    }
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);
  const pending = receipt?.bookings.some((b) => b.status === "pending");
  const cancelled = receipt?.bookings.every((b) => b.status === "cancelled");
  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <p className="micro-label text-primary">Il tuo viaggio a Praga</p>
        <h1 className="display-xl my-5">
          {cancelled
            ? "Prenotazione non attiva."
            : pending
              ? "Prenotazione registrata."
              : "Grazie per aver scelto i nostri tour."}
        </h1>
        {message && (
          <p role="status" className="card mb-6 p-5">
            {message}
          </p>
        )}
        {!receipt && !message && (
          <p role="status">Caricamento del riepilogo…</p>
        )}
        {receipt && (
          <>
            <p className="mb-6">
              Riceverai via email i dettagli e le informazioni sul pagamento.
              L’email include il link per modificare o cancellare la singola
              prenotazione, senza creare un account.
            </p>
            {receipt.bookings.map((b) => (
              <article key={b.pnr} className="card mb-5 grid gap-4 p-6">
                <div className="flex flex-wrap justify-between gap-3">
                  <strong>{b.pnr}</strong>
                  <span className="status-chip">
                    {
                      {
                        confirmed: "Confermata",
                        pending: "Pagamento da completare",
                        cancelled: "Cancellata",
                        present: "Partecipazione registrata",
                        no_show: "Assente",
                      }[b.status]
                    }
                  </span>
                </div>
                <h2 className="display-md">{b.tourTitle}</h2>
                <p>
                  {new Date(b.startsAt).toLocaleString("it-IT", {
                    timeZone: "Europe/Prague",
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </p>
                <p>
                  {b.adults} adulti · {b.children} bambini · {b.infants} infanti
                  · {formatMoney(b.totalCents)}
                </p>
                <p>
                  {b.meetingPoint}
                  <br />
                  {b.meetingAddress}
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={b.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="button-secondary"
                  >
                    Apri le indicazioni
                  </a>
                  <a
                    href={`/api/calendar/booking/${b.pnr}?token=${proof}`}
                    className="button-secondary"
                  >
                    Aggiungi al calendario
                  </a>
                </div>
              </article>
            ))}
            {pending && receipt.order.paymentUrl && (
              <a
                href={receipt.order.paymentUrl}
                className="button-primary mb-6"
              >
                Completa il pagamento
              </a>
            )}
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/tour" className="button-primary">
            Scopri altre esperienze
          </Link>
          <Link href="/contatti" className="button-secondary">
            Contatta il team
          </Link>
        </div>
      </div>
    </section>
  );
}
