"use client";

import { useMemo, useState } from "react";
import { TourCard } from "@/components/TourCard";
import type { Tour } from "@/lib/types";

export function TourFilters({ tours }: { tours: Tour[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("1");
  const dates = useMemo(() => [...new Set(tours.flatMap((tour) => tour.slots.map((slot) => slot.startsAt.slice(0, 10))))].sort(), [tours]);
  const visibleTours = tours.filter((tour) => {
    const searchable = `${tour.title} ${tour.category} ${tour.shortDescription}`.toLocaleLowerCase("it");
    if (!searchable.includes(query.toLocaleLowerCase("it"))) return false;
    if (category !== "all" && tour.category !== category) return false;
    const party = Number(guests);
    return tour.slots.some((slot) => {
      const matchingDate = !date || slot.startsAt.startsWith(date);
      return matchingDate && slot.capacity - slot.reserved >= party;
    });
  });

  return <>
    <div className="mb-8 grid gap-3 rounded-[28px] border border-hairline bg-surface-card p-3 md:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-1 px-3"><span className="caption text-ink">Cerca</span><input aria-label="Cerca un tour" placeholder="Es. Castello, birra..." value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 bg-transparent text-sm text-body outline-none" /></label>
      <label className="grid gap-1 border-hairline px-3 lg:border-x lg:px-5"><span className="caption text-ink">Tour</span><select aria-label="Tipo di tour" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-transparent text-sm text-body outline-none"><option value="all">Tutte le esperienze</option>{[...new Set(tours.map((tour) => tour.category))].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="grid gap-1 border-hairline px-3 lg:border-r lg:px-5"><span className="caption text-ink">Data</span><input aria-label="Data disponibile" type="date" value={date} min={dates[0]} max={dates[dates.length - 1]} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-sm text-body outline-none" /></label>
      <label className="grid gap-1 px-3"><span className="caption text-ink">Partecipanti</span><select aria-label="Numero partecipanti" value={guests} onChange={(e) => setGuests(e.target.value)} className="bg-transparent text-sm text-body outline-none">{[1, 2, 3, 4, 5, 6].map((item) => <option key={item} value={item}>{item} {item === 1 ? "persona" : "persone"}</option>)}</select></label>
    </div>
    {visibleTours.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visibleTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}</div> : <div className="card p-8 text-center"><p className="body-md">Nessun tour corrisponde ai filtri scelti. Prova un&apos;altra data o meno partecipanti.</p></div>}
  </>;
}
