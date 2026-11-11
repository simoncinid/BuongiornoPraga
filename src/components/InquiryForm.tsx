"use client";
import { useState } from "react";
import Link from "next/link";
export function InquiryForm({ partner = false }: { partner?: boolean }) {
  const [sent, setSent] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return sent ? (
    <div className="card grid gap-5 p-8">
      <h2 className="display-md">Richiesta ricevuta.</h2>
      <p>Il team ti risponderà all’indirizzo indicato.</p>
      <button className="button-secondary" onClick={() => setSent(false)}>
        Invia un’altra richiesta
      </button>
    </div>
  ) : (
    <form
      className="card grid gap-5 p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
          const details = partner
            ? `\nData: ${f.get("date")}\nPartecipanti: ${f.get("guests")}`
            : "";
          const r = await fetch("/api/platform/inquiry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: f.get("name"),
              email: f.get("email"),
              type: partner ? f.get("type") : "Contatto",
              message: String(f.get("message")) + details,
              privacy: f.get("privacy") === "on",
              website: f.get("website"),
            }),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          setSent(true);
        } catch (e) {
          setMessage(
            e instanceof Error ? e.message : "Connessione non disponibile",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="display-md">
        {partner ? "Parliamo del tuo gruppo." : "Come possiamo aiutarti?"}
      </h2>
      <label>
        Nome e cognome
        <input
          name="name"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          className="text-input"
        />
      </label>
      <label>
        Email
        <input
          name="email"
          required
          type="email"
          autoComplete="email"
          className="text-input"
        />
      </label>
      {partner && (
        <>
          <label>
            Tipo di richiesta
            <select name="type" className="text-input">
              {[
                "Tour privato",
                "Scuola o gruppo",
                "Hotel partner",
                "Agenzia di viaggio",
                "Affiliazione",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Data indicativa
              <input type="date" name="date" className="text-input" />
            </label>
            <label>
              Partecipanti
              <input
                type="number"
                name="guests"
                min={1}
                className="text-input"
              />
            </label>
          </div>
        </>
      )}
      <label>
        Il tuo messaggio
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={4500}
          className="text-input min-h-32"
        />
      </label>
      <label className="hidden" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="privacy" required />
        <span>
          Ho letto l’
          <Link href="/privacy" className="underline">
            informativa privacy
          </Link>
          .
        </span>
      </label>
      {message && <p role="alert">{message}</p>}
      <button disabled={busy} className="button-primary">
        {busy ? "Invio…" : "Invia richiesta"}
      </button>
    </form>
  );
}
