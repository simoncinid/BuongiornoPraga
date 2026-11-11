"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  getCartItems,
  removeFromCart,
  clearCart,
  cartItemTotal,
  type CartItem,
} from "@/lib/cart";
import { formatMoney } from "@/lib/format";
export function ReservationFlow({ mode }: { mode: "cart" | "checkout" }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [affiliateCode, setAffiliate] = useState("");
  const [method, setMethod] = useState<"cash" | "stripe">("cash");
  const [quote, setQuote] = useState<
    | { subtotalCents: number; discountCents: number; totalCents: number }[]
    | null
  >(null);
  const [rules, setRules] = useState({
    minimumTours: 2,
    multiTourPercent: 10,
    cancellationHours: 24,
  });
  const key = useRef("");
  useEffect(() => {
    setItems(getCartItems());
    setAffiliate(localStorage.getItem("ftp-affiliate") || "");
    key.current =
      sessionStorage.getItem("ftp-checkout-key") || crypto.randomUUID();
    sessionStorage.setItem("ftp-checkout-key", key.current);
    setReady(true);
    fetch("/api/platform/catalog")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setRules(d.settings);
      })
      .catch(() => {});
  }, []);
  const payloadItems = items.map((i) => ({
    tourSlug: i.tourSlug,
    slotId: i.slotId,
    adults: i.adults,
    children: i.children,
    infants: i.infants || 0,
  }));
  useEffect(() => {
    if (!items.length) return;
    const abort = new AbortController();
    setQuote(null);
    fetch("/api/platform/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payloadItems, affiliateCode }),
      signal: abort.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setQuote(d.items);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => abort.abort();
  }, [items, affiliateCode]); // eslint-disable-line react-hooks/exhaustive-deps
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const input = {
        items: payloadItems,
        affiliateCode,
        name: f.get("name"),
        email: f.get("email"),
        phone: String(f.get("phone")).replace(/[\s()-]/g, ""),
        notes: f.get("notes"),
        paymentMethod: method,
        termsAccepted: f.get("terms") === "on",
        whatsappConsent: f.get("whatsapp") === "on",
      };
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(input)),
      );
      const fingerprint = Array.from(new Uint8Array(digest))
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      if (sessionStorage.getItem("ftp-checkout-fingerprint") !== fingerprint) {
        key.current = crypto.randomUUID();
        sessionStorage.setItem("ftp-checkout-key", key.current);
        sessionStorage.setItem("ftp-checkout-fingerprint", fingerprint);
      }
      const r = await fetch("/api/platform/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key.current,
        },
        body: JSON.stringify(input),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      sessionStorage.setItem(
        "ftp-checkout-receipt",
        JSON.stringify({ proof: d.receiptProof }),
      );
      clearCart();
      sessionStorage.removeItem("ftp-checkout-key");
      sessionStorage.removeItem("ftp-checkout-fingerprint");
      window.location.assign(d.paymentUrl || d.confirmationUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di connessione");
      setBusy(false);
    }
  }
  if (!ready) return <p role="status">Caricamento…</p>;
  if (!items.length)
    return (
      <div className="card mx-auto max-w-xl p-10 text-center">
        <h1 className="display-lg mb-5">Il tuo viaggio comincia qui.</h1>
        <p className="mb-6">Scegli un tour e aggiungilo al carrello.</p>
        <Link className="button-primary" href="/tour">
          Scopri le esperienze
        </Link>
      </div>
    );
  const subtotal =
    quote?.reduce((s, i) => s + i.subtotalCents, 0) ??
    items.reduce((s, i) => s + cartItemTotal(i), 0);
  const discount = quote?.reduce((s, i) => s + i.discountCents, 0) || 0;
  return (
    <>
      <div className="mb-8">
        <p className="micro-label text-primary">
          Il tuo viaggio ·{" "}
          {mode === "cart" ? "1. Esperienze" : "2. Contatti e conferma"}
        </p>
        <h1 className="display-xl mt-3">
          {mode === "cart"
            ? "La tua Praga, in programma."
            : "Manca solo un passo."}
        </h1>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          {items.map((i) => (
            <article key={i.id} className="card flex gap-5 p-5">
              <div className="min-w-0 flex-1">
                <h2 className="display-md">{i.tourTitle}</h2>
                <p className="my-2">
                  {new Date(i.startsAt).toLocaleString("it-IT", {
                    timeZone: "Europe/Prague",
                  })}
                </p>
                <p className="text-sm">
                  {i.adults} adulti · {i.children} bambini · {i.infants || 0}{" "}
                  infanti
                </p>
                <strong>{formatMoney(cartItemTotal(i))}</strong>
              </div>
              <button
                aria-label={`Rimuovi ${i.tourTitle}`}
                className="text-sm underline"
                onClick={() => {
                  removeFromCart(i.id);
                  setItems(getCartItems());
                }}
              >
                Rimuovi
              </button>
            </article>
          ))}
          {mode === "checkout" && (
            <form
              id="reservation"
              className="card grid gap-5 p-7"
              onSubmit={submit}
            >
              <h2 className="display-md">I tuoi contatti</h2>
              <label>
                Nome e cognome
                <input
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={120}
                  required
                  className="text-input"
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="text-input"
                />
              </label>
              <label>
                Telefono con prefisso internazionale
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+393331234567"
                  required
                  className="text-input"
                />
              </label>
              <label>
                Note per la guida
                <textarea
                  name="notes"
                  maxLength={2000}
                  className="text-input"
                />
              </label>
              <fieldset className="grid gap-3">
                <legend className="mb-3 font-bold">
                  Come preferisci pagare?
                </legend>
                <label className="card flex gap-3 p-4">
                  <input
                    type="radio"
                    name="payment"
                    checked={method === "cash"}
                    onChange={() => setMethod("cash")}
                  />{" "}
                  Contanti sul posto
                </label>
                <label className="card flex gap-3 p-4">
                  <input
                    type="radio"
                    name="payment"
                    checked={method === "stripe"}
                    onChange={() => setMethod("stripe")}
                  />{" "}
                  Carta con link sicuro Stripe
                </label>
              </fieldset>
              <p className="text-sm">
                Cancellazione gratuita fino a {rules.cancellationHours} ore
                prima. Per i pagamenti online, i posti restano riservati per 30
                minuti.
              </p>
              <label className="flex items-start gap-3 text-sm">
                <input name="whatsapp" type="checkbox" />
                Desidero ricevere il promemoria del tour su WhatsApp al numero
                indicato (facoltativo).
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input name="terms" type="checkbox" required />
                <span>
                  Ho letto la{" "}
                  <Link href="/privacy" className="underline">
                    privacy
                  </Link>{" "}
                  e accetto i{" "}
                  <Link href="/termini" className="underline">
                    termini di prenotazione
                  </Link>
                  .
                </span>
              </label>
            </form>
          )}
        </div>
        <aside className="card sticky top-24 grid gap-5 p-7">
          <h2 className="display-md">Il tuo riepilogo</h2>
          <div className="flex justify-between">
            <span>{items.length} esperienze</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
          <p className="text-sm">
            Con almeno {rules.minimumTours} tour diversi, sconto automatico del{" "}
            {rules.multiTourPercent}%.
          </p>
          <label className="text-sm">
            Codice partner (facoltativo)
            <input
              className="text-input"
              value={affiliateCode}
              maxLength={40}
              onChange={(e) => setAffiliate(e.target.value.toUpperCase())}
            />
          </label>
          {discount > 0 && (
            <p className="flex justify-between text-success">
              <span>Sconto multi-tour</span>
              <strong>−{formatMoney(discount)}</strong>
            </p>
          )}
          <div className="flex justify-between border-t pt-5 text-xl">
            <strong>Totale</strong>
            <strong>{formatMoney(subtotal - discount)}</strong>
          </div>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          {mode === "cart" ? (
            <Link className="button-primary" href="/checkout">
              Continua la prenotazione
            </Link>
          ) : (
            <button
              type="submit"
              form="reservation"
              disabled={busy || !quote}
              className="button-primary"
            >
              {busy
                ? "Prenotazione in corso…"
                : method === "stripe"
                  ? "Prenota e vai al pagamento"
                  : "Conferma prenotazione"}
            </button>
          )}
          <Link href="/tour" className="text-center text-sm underline">
            Aggiungi un’altra esperienza
          </Link>
        </aside>
      </div>
    </>
  );
}
