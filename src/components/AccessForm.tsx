"use client";
import { useState } from "react";
export function AccessForm() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="card mx-auto grid max-w-lg gap-5 p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fetch("/api/platform/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              Object.fromEntries(new FormData(e.currentTarget)),
            ),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          window.location.assign("/admin");
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Errore connessione");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="display-lg">Benvenuto nel team.</h1>
      <p>Accedi allo spazio di gestione riservato allo staff.</p>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="text-input"
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="text-input"
        />
      </label>
      <button className="button-primary" disabled={busy}>
        {busy ? "Attendi…" : "Accedi"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
