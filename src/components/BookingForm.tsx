"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Minus,
  Plus,
  Users,
} from "lucide-react";
import { addToCart } from "@/lib/cart";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { availableSeats } from "@/lib/pricing";
import type { Tour } from "@/lib/types";

const italianMonths = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];
const weekDays = ["L", "M", "M", "G", "V", "S", "D"];
const steps = ["Data", "Orario", "Biglietti"] as const;

function dayKey(value: string) {
  return new Date(value).toLocaleDateString("en-CA", {
    timeZone: "Europe/Prague",
  });
}

export function BookingForm({ tour: initialTour }: { tour: Tour }) {
  const [tour, setTour] = useState(initialTour);
  useEffect(() => {
    const refresh = () =>
      fetch("/api/platform/catalog")
        .then((r) => r.json())
        .then((d) => {
          const updated = d.tours?.find(
            (t: Tour) => t.slug === initialTour.slug,
          );
          if (updated) setTour(updated);
        })
        .catch(() => {});
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [initialTour.slug]);
  const router = useRouter();
  const firstSlot = tour.slots[0];
  const [step, setStep] = useState(0);
  const [month, setMonth] = useState(() =>
    new Date(firstSlot?.startsAt || Date.now()).getMonth(),
  );
  const [year, setYear] = useState(() =>
    new Date(firstSlot?.startsAt || Date.now()).getFullYear(),
  );
  const [selectedDay, setSelectedDay] = useState("");
  const [slotId, setSlotId] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, typeof tour.slots>();
    tour.slots.forEach((slot) => {
      const key = dayKey(slot.startsAt);
      map.set(key, [...(map.get(key) || []), slot]);
    });
    return map;
  }, [tour.slots]);

  const daySlots = slotsByDay.get(selectedDay) || [];
  const selectedSlot = tour.slots.find((slot) => slot.id === slotId);
  const adultMinAge = tour.adultMinAge ?? 12;
  const childMinAge = tour.childMinAge ?? 4;
  const guests = adults + children + infants;
  const seats = selectedSlot
    ? availableSeats(selectedSlot.capacity, selectedSlot.reserved)
    : 0;
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total =
    adults * tour.basePriceCents +
    children * tour.childPriceCents +
    infants * tour.infantPriceCents;

  function moveMonth(direction: number) {
    const next = new Date(year, month + direction, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  }

  function chooseDay(key: string) {
    if (!slotsByDay.has(key)) return;
    setSelectedDay(key);
    setSlotId("");
    setStep(1);
  }

  function chooseSlot(id: string) {
    setSlotId(id);
    setStep(2);
  }

  function continueToCheckout() {
    if (!selectedSlot || guests < 1 || guests > seats) return;
    addToCart({
      tourSlug: tour.slug,
      tourTitle: tour.title,
      slotId: selectedSlot.id,
      startsAt: selectedSlot.startsAt,
      adults,
      children,
      infants,
      unitInfantCents: tour.infantPriceCents,
      unitAdultCents: tour.basePriceCents,
      unitChildCents: tour.childPriceCents,
      imageUrl: tour.imageUrl,
    });
    router.push("/carrello");
  }

  const selectedDayLabel = selectedDay
    ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString("it-IT", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "";

  if (!tour.slots.length)
    return (
      <aside className="card p-6">
        <h2 className="display-md">Nuove partenze in arrivo.</h2>
        <p className="mt-4">
          Al momento non ci sono partenze prenotabili. Contattaci per
          organizzare la visita.
        </p>
        <a href="/contatti" className="button-secondary mt-5">
          Contatta il team
        </a>
      </aside>
    );
  return (
    <aside className="card shadow-card sticky top-24 self-start overflow-hidden">
      <div className="bg-primary-soft px-6 py-4 text-sm font-semibold text-ink">
        <span className="mr-2 text-primary">ϟ</span> Prenota online, scegli come
        pagare
      </div>

      <div className="grid gap-5 p-6">
        <div className="flex items-center gap-2">
          {steps.map((label, index) => (
            <div key={label} className="flex flex-1 flex-col gap-1.5">
              <div
                className={`h-1 rounded-full ${index <= step ? "bg-primary" : "bg-hairline-soft"}`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${index === step ? "text-ink" : "text-muted-soft"}`}
              >
                {index + 1}. {label}
              </span>
            </div>
          ))}
        </div>

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
            <div>
              <h3 className="font-display text-2xl font-medium text-ink">
                Scegli la data
              </h3>
              <p className="mt-1 text-sm text-muted">
                Solo i giorni evidenziabili sono disponibili.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                aria-label="Mese precedente"
                className="text-muted"
              >
                <ChevronLeft size={25} />
              </button>
              <strong className="font-display text-3xl font-medium text-ink">
                {italianMonths[month]} {year}
              </strong>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                aria-label="Mese successivo"
                className="text-muted"
              >
                <ChevronRight size={25} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-muted">
              {weekDays.map((day, i) => (
                <span key={`${day}-${i}`} className="py-1">
                  {day}
                </span>
              ))}
              {Array.from({ length: startOffset }).map((_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const key = new Date(year, month, day).toLocaleDateString(
                  "en-CA",
                  { timeZone: "Europe/Prague" },
                );
                const available = slotsByDay.has(key);
                const active = key === selectedDay;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!available}
                    onClick={() => chooseDay(key)}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ${active ? "bg-primary font-bold text-on-primary" : available ? "font-semibold text-ink hover:bg-surface-soft" : "cursor-not-allowed text-muted-soft line-through"}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div>
              <h3 className="font-display text-2xl font-medium text-ink">
                Scegli l&apos;orario
              </h3>
              <p className="mt-1 text-sm text-muted">
                Disponibilità per {selectedDayLabel}.
              </p>
            </div>
            <div className="grid gap-2">
              {daySlots.map((slot) => {
                const free = availableSeats(slot.capacity, slot.reserved);
                const active = slot.id === slotId;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={free === 0}
                    onClick={() => chooseSlot(slot.id)}
                    className={`flex items-center justify-between border px-4 py-3 text-left transition ${active ? "border-primary bg-primary-soft" : free === 0 ? "cursor-not-allowed border-hairline-soft opacity-50" : "border-hairline hover:border-primary"}`}
                  >
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      <Clock3 size={18} className="text-primary" />
                      {new Date(slot.startsAt).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/Prague",
                      })}
                    </span>
                    <span className="text-xs text-muted">
                      {free === 0 ? "Sold out" : `${free} posti`}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div>
              <h3 className="font-display text-2xl font-medium text-ink">
                Scegli i biglietti
              </h3>
              <p className="mt-1 text-sm text-muted">
                {selectedDayLabel}
                {selectedSlot
                  ? ` · ${new Date(selectedSlot.startsAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" })}`
                  : ""}
              </p>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <Users size={18} /> Persone
              </div>
              <Counter
                label={`Adulti (da ${adultMinAge} anni)`}
                price={tour.basePriceCents}
                value={adults}
                min={1}
                onChange={setAdults}
              />
              <Counter
                label={`Bambini (${childMinAge}–${adultMinAge - 1} anni)`}
                price={tour.childPriceCents}
                value={children}
                min={0}
                onChange={setChildren}
              />
              {childMinAge > 0 && (
                <Counter
                  label={`Infanti (0–${childMinAge - 1} anni)`}
                  price={tour.infantPriceCents}
                  value={infants}
                  min={0}
                  onChange={setInfants}
                />
              )}
            </div>
            <div className="flex justify-between border-t border-hairline-soft pt-4 text-sm">
              <span className="text-muted">Totale</span>
              <strong className="text-ink">{formatMoney(total)}</strong>
            </div>
            {guests > seats ? (
              <p className="text-xs text-red-700">
                Posti insufficienti per il numero selezionato.
              </p>
            ) : null}
            <button
              type="button"
              onClick={continueToCheckout}
              disabled={!selectedSlot || guests > seats}
              className="button-primary w-full !rounded-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CalendarDays size={17} /> Aggiungi al carrello
              <ArrowRight size={17} />
            </button>
          </>
        ) : null}
      </div>
    </aside>
  );
}

function Counter({
  label,
  price,
  value,
  min,
  onChange,
}: {
  label: string;
  price: number;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-hairline-soft py-3 last:border-0">
      <div>
        <strong className="block text-sm text-ink">{label}</strong>
        <span className="text-xs text-muted">{formatMoney(price)}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="text-muted"
          aria-label={`Riduci ${label}`}
        >
          <Minus size={18} />
        </button>
        <strong className="w-5 text-center text-ink">{value}</strong>
        <button
          type="button"
          onClick={() => onChange(Math.min(100, value + 1))}
          className="text-primary"
          aria-label={`Aumenta ${label}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
