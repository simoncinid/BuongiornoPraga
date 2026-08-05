"use client";

import { useState } from "react";

export function SelfServiceActions({ pnr }: { pnr: string }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    const response = await fetch(`/api/bookings/${pnr}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });
    const json = await response.json();
    setMessage(response.ok ? "Prenotazione cancellata e posti liberati." : json.error || "Errore");
    setLoading(false);
  }

  async function requestChange() {
    setLoading(true);
    const response = await fetch(`/api/bookings/${pnr}/modify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: reason }) });
    const json = await response.json();
    setMessage(response.ok ? "Richiesta di modifica registrata: ti ricontatteremo con le alternative disponibili." : json.error || "Errore");
    setLoading(false);
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-2">
        <span className="caption text-ink">Motivo o richiesta modifica</span>
        <textarea className="text-input min-h-28" value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-3">
        <button className="button-secondary" type="button" disabled={loading || !reason} onClick={requestChange}>
          Richiedi modifica
        </button>
        <button className="button-primary" type="button" disabled={loading || !reason} onClick={cancel}>
          Cancella prenotazione
        </button>
      </div>
      {message ? <p className="body-sm !text-success">{message}</p> : null}
    </div>
  );
}
