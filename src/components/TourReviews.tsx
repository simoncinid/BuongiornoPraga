"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const reviews = [
  ["Marta R.", "Guida preparatissima, gruppo piccolo e ritmi perfetti. Abbiamo visto Praga senza la sensazione di rincorrere una lista."],
  ["Luca e Sara", "Punto d'incontro chiarissimo e ottimi consigli per i giorni successivi. Esperienza davvero ben organizzata."],
  ["Elena B.", "Il Castello raccontato con passione: molto più di una semplice visita. Comunicazione WhatsApp comodissima."],
  ["Paolo M.", "Tour piacevole e mai affollato. Ci siamo sentiti seguiti dall'inizio alla fine."],
  ["Giulia F.", "La nostra guida ha adattato il passo del gruppo con grande attenzione. Consigliato anche a chi viaggia con ragazzi."],
  ["Andrea C.", "Prenotazione semplice, informazioni precise e un itinerario pieno di piccoli dettagli che da soli non avremmo colto."],
  ["Valentina P.", "Una Praga più autentica, spiegata benissimo in italiano. Da rifare."],
  ["Marco T.", "Organizzazione impeccabile e un'atmosfera molto piacevole."],
  ["Chiara L.", "Niente tempi morti e tanti consigli pratici. Ottimo rapporto qualità-prezzo."],
  ["Francesca D.", "La scelta migliore del nostro weekend a Praga."],
];

export function TourReviews() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(reviews.length / 5);
  const visible = reviews.slice(page * 5, page * 5 + 5);
  return <section className="border-t border-hairline-soft pt-8">
    <div className="mb-4 flex items-center justify-between"><div><p className="micro-label text-muted">Esperienze raccontate</p><h2 className="display-md">Recensioni degli ospiti</h2></div><span className="flex items-center gap-1 text-sm font-semibold text-ink"><Star size={16} className="text-primary" fill="currentColor" color="currentColor" /> 4.9/5</span></div>
    <div className="grid gap-3">{visible.map(([name, quote]) => <article key={name} className="card p-4"><div className="mb-2 flex gap-0.5 text-primary">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</div><p className="body-sm">“{quote}”</p><strong className="mt-3 block text-sm text-ink">{name}</strong></article>)}</div>
    <div className="mt-5 flex items-center justify-between"><span className="text-xs text-muted">Pagina {page + 1} di {totalPages}</span><div className="flex gap-2"><button aria-label="Recensioni precedenti" disabled={page === 0} onClick={() => setPage(page - 1)} className="button-secondary !min-h-9 !rounded-full !px-3 !py-2 disabled:opacity-40"><ChevronLeft size={16} /></button><button aria-label="Recensioni successive" disabled={page === totalPages - 1} onClick={() => setPage(page + 1)} className="button-secondary !min-h-9 !rounded-full !px-3 !py-2 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>
  </section>;
}
