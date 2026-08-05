"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import type { Tour } from "@/lib/types";
import { saveBookingToAccount } from "@/lib/account-local";

export function CheckoutForm({ tour, slotId, adults, children }: { tour: Tour; slotId: string; adults: number; children: number }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tourSlug: tour.slug, slotId, adults, children, infants: 0, name, email, phone, paymentMethod: "stripe" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Impossibile completare la prenotazione");
      saveBookingToAccount({ name, email, phone }, json.booking);
      window.location.assign(json.booking.stripePaymentUrl || `/prenotazione/${json.booking.pnr}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Errore imprevisto"); } finally { setLoading(false); }
  }
  return <div className="card shadow-card grid gap-4 p-6"><p className="body-sm">{tour.title}</p><label className="grid gap-2"><span className="caption text-ink">Nome e cognome</span><input className="text-input" value={name} onChange={(e) => setName(e.target.value)} /></label><label className="grid gap-2"><span className="caption text-ink">Email</span><input className="text-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="grid gap-2"><span className="caption text-ink">Numero WhatsApp</span><input className="text-input" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>{error ? <p className="text-sm text-red-700">{error}</p> : null}<button disabled={!name || !email || !phone || loading} onClick={submit} className="button-primary w-full !rounded-full disabled:opacity-50"><CreditCard size={18} /> {loading ? "Attendi..." : "Vai al pagamento sicuro"}</button></div>;
}
