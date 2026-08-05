"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CreditCard, Banknote, ShoppingCart, CheckCircle2 } from "lucide-react";
import { addToCart, getCartItems, removeFromCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import type { PaymentMethod, Tour, TourSlot } from "@/lib/types";

const steps = ["Dati personali", "Pagamento", "Acquisto"] as const;

type Props = {
  tour: Tour;
  slot: TourSlot;
  adults: number;
  children: number;
};

export function CheckoutWizard({ tour, slot, adults, children }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  const total = useMemo(
    () => adults * tour.basePriceCents + children * tour.childPriceCents,
    [adults, children, tour.basePriceCents, tour.childPriceCents]
  );

  const dateLabel = new Date(slot.startsAt).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const timeLabel = new Date(slot.startsAt).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit"
  });

  function canContinuePersonal() {
    return name.trim().length >= 2 && email.includes("@") && phone.trim().length >= 6;
  }

  function handleAddToCart() {
    setAddingCart(true);
    addToCart({
      tourSlug: tour.slug,
      tourTitle: tour.title,
      slotId: slot.id,
      startsAt: slot.startsAt,
      adults,
      children,
      unitAdultCents: tour.basePriceCents,
      unitChildCents: tour.childPriceCents,
      imageUrl: tour.imageUrl
    });
    router.push("/tour?added=1");
  }

  async function confirmPurchase() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourSlug: tour.slug,
          slotId: slot.id,
          adults,
          children,
          infants: 0,
          name,
          email,
          phone,
          paymentMethod
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Impossibile completare la prenotazione");
      getCartItems()
        .filter((item) => item.tourSlug === tour.slug && item.slotId === slot.id)
        .forEach((item) => removeFromCart(item.id));
      window.location.assign(json.booking.stripePaymentUrl || `/prenotazione/${json.booking.pnr}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-6">
        <div>
          <p className="micro-label mb-3 text-primary">{step + 1} · {steps[step]}</p>
          <h1 className="display-lg mb-2">Completa l&apos;acquisto</h1>
          <p className="body-sm">Tre passaggi rapidi: i tuoi dati, il metodo di pagamento e la conferma.</p>
        </div>

        <div className="flex items-center gap-2">
          {steps.map((label, index) => (
            <div key={label} className="flex flex-1 flex-col gap-1.5">
              <div className={`h-1.5 rounded-full ${index <= step ? "bg-primary" : "bg-hairline"}`} />
              <span className={`text-[11px] font-bold uppercase tracking-wider ${index === step ? "text-ink" : "text-muted-soft"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="card shadow-card grid gap-5 p-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="inline-flex items-center gap-1 self-start text-sm font-semibold text-muted hover:text-ink"
            >
              <ArrowLeft size={16} /> Indietro
            </button>
          ) : null}

          {step === 0 ? (
            <>
              <h2 className="display-md">Informazioni personali</h2>
              <label className="grid gap-2">
                <span className="caption text-ink">Nome e cognome</span>
                <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
              <label className="grid gap-2">
                <span className="caption text-ink">Email</span>
                <input className="text-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </label>
              <label className="grid gap-2">
                <span className="caption text-ink">Numero WhatsApp</span>
                <input className="text-input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
              </label>
              <button
                type="button"
                disabled={!canContinuePersonal()}
                onClick={() => setStep(1)}
                className="button-primary w-full !rounded-full disabled:opacity-50"
              >
                Continua <ArrowRight size={17} />
              </button>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <h2 className="display-md">Dati di pagamento</h2>
              <p className="body-sm">Scegli come preferisci saldare. Il pagamento con carta avviene in modo sicuro al passo successivo.</p>
              <button
                type="button"
                onClick={() => setPaymentMethod("stripe")}
                className={`flex items-start gap-3 border px-4 py-4 text-left ${paymentMethod === "stripe" ? "border-primary bg-[#fbf3dd]" : "border-hairline"}`}
              >
                <CreditCard className="mt-0.5 shrink-0 text-primary" size={22} />
                <span>
                  <strong className="block text-ink">Carta / Stripe</strong>
                  <span className="text-sm text-muted">Pagamento online sicuro. Conferma immediata della prenotazione.</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex items-start gap-3 border px-4 py-4 text-left ${paymentMethod === "cash" ? "border-primary bg-[#fbf3dd]" : "border-hairline"}`}
              >
                <Banknote className="mt-0.5 shrink-0 text-primary" size={22} />
                <span>
                  <strong className="block text-ink">Contanti sul posto</strong>
                  <span className="text-sm text-muted">Prenoti ora e paghi direttamente alla guida il giorno del tour.</span>
                </span>
              </button>
              <button type="button" onClick={() => setStep(2)} className="button-primary w-full !rounded-full">
                Continua <ArrowRight size={17} />
              </button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h2 className="display-md">Conferma acquisto</h2>
              <ul className="grid gap-3 border border-hairline-soft bg-surface-soft p-4 text-sm">
                <li className="flex justify-between gap-4"><span className="text-muted">Nome</span><strong className="text-ink">{name}</strong></li>
                <li className="flex justify-between gap-4"><span className="text-muted">Email</span><strong className="text-ink">{email}</strong></li>
                <li className="flex justify-between gap-4"><span className="text-muted">WhatsApp</span><strong className="text-ink">{phone}</strong></li>
                <li className="flex justify-between gap-4"><span className="text-muted">Pagamento</span><strong className="text-ink">{paymentMethod === "stripe" ? "Carta / Stripe" : "Contanti"}</strong></li>
                <li className="flex justify-between gap-4 border-t border-hairline-soft pt-3"><span className="text-muted">Totale</span><strong className="text-ink">{formatMoney(total)}</strong></li>
              </ul>
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <button
                type="button"
                disabled={loading}
                onClick={confirmPurchase}
                className="button-primary w-full !rounded-full disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                {loading ? "Attendi..." : paymentMethod === "stripe" ? "Paga e conferma" : "Conferma prenotazione"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <aside className="card shadow-card sticky top-24 self-start overflow-hidden">
        <div className="border-b border-hairline-soft p-5">
          <p className="micro-label mb-2 text-muted">Il tuo ordine</p>
          <h2 className="display-md !text-[26px]">{tour.title}</h2>
          <p className="mt-2 text-sm text-muted capitalize">{dateLabel}</p>
          <p className="text-sm text-muted">{timeLabel} · {adults} adulti{children ? ` · ${children} bambini` : ""}</p>
        </div>
        <div className="grid gap-3 p-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Prezzo totale</span>
            <strong className="text-xl text-ink">{formatMoney(total)}</strong>
          </div>
          <button
            type="button"
            disabled={addingCart}
            onClick={handleAddToCart}
            className="button-secondary w-full !rounded-full"
          >
            <ShoppingCart size={17} />
            {addingCart ? "Aggiungo..." : "Aggiungi al carrello"}
          </button>
          <p className="text-xs text-muted">
            Non vuoi acquistare subito? Aggiungi al carrello e continua a esplorare altri tour.
          </p>
          <Link href="/tour" className="text-center text-sm font-semibold text-ink underline-offset-2 hover:underline">
            Torna ai tour
          </Link>
        </div>
      </aside>
    </div>
  );
}
