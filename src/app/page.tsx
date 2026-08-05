import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CalendarSearch, MapPin, MessageCircle, ShieldCheck, Star, Users } from "lucide-react";
import { TourCard } from "@/components/TourCard";
import { AIAnswerSection } from "@/components/AIAnswerSection";
import { JsonLd } from "@/components/JsonLd";
import { PragueGallery } from "@/components/PragueGallery";
import { TripAdvisorSection } from "@/components/TripAdvisorSection";
import { faqs, tours, trustPillars } from "@/lib/data";
import { breadcrumbJsonLd } from "@/lib/seo";
import { site, whatsappHref } from "@/lib/site";

export default function HomePage() {
  const stats: Array<[string, string, LucideIcon]> = [
    ["4.9/5", "Valutazione media", Star],
    ["H24", "Assistenza WhatsApp", MessageCircle],
    ["14 max", "Gruppi ristretti", Users],
    ["1 click", "Punto geolocalizzato", MapPin]
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: site.url }
        ])}
      />
      <section className="hero-image">
        <div className="container-page grid min-h-[570px] items-center py-20">
          <div className="max-w-2xl">
            <p className="uppercase-tag mb-5 text-primary">Tour guidati in italiano a Praga</p>
            <h1 className="display-xl hero-title mb-5">Vivi Praga<br /><em>senza pensieri.</em></h1>
            <p className="body-md mb-8 max-w-xl">
              Niente itinerari improvvisati su Google Maps, gruppi di massa soffocanti o trappole per turisti.
              Prenotazione rapida, cancellazione flessibile e assistenza WhatsApp H24 sempre in tasca.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/tour" className="button-primary">
                Vedi tour disponibili <ArrowRight size={18} />
              </Link>
              <a className="button-secondary hero-cta" href={whatsappHref("Ciao Buongiorno Praga, mi aiutate a scegliere il tour giusto?")}>
                <MessageCircle size={18} /> Scrivi su WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-hairline-soft bg-surface-card py-8">
        <div className="container-page grid gap-6 md:grid-cols-4">
          {stats.map(([value, label, Icon]) => (
            <div key={label} className="flex items-center justify-center gap-3 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 text-primary">
                <Icon size={20} />
              </span>
              <span>
                <strong className="block text-[11px] uppercase tracking-[1.5px] text-ink">{value}</strong>
                <span className="text-xs text-muted">{label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="editorial-section experiences-section">
        <div className="container-page">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="uppercase-tag mb-3 text-primary">Esperienze selezionate</p>
              <h2 className="display-lg">Tour più amati</h2>
              <p className="body-sm mt-2">Esperienze indimenticabili con guide italiane.</p>
            </div>
            <Link href="/tour" className="uppercase-tag w-fit text-ink">
              Vedi tutti i tour <ArrowRight className="inline" size={15} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-section bg-navy text-on-dark">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="uppercase-tag mb-3 text-primary">Perché sceglierci</p>
            <h2 className="display-lg !text-on-dark">Non sei solo un turista.<br />Sei <em className="text-primary">nostro ospite.</em></h2>
            <p className="body-md mt-5 max-w-md !text-hairline-soft">Conosciamo Praga, la viviamo ogni giorno e vogliamo farti scoprire la sua anima autentica.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {trustPillars.map((pillar) => (
              <div key={pillar.title} className="border-b border-white/15 py-4 last:border-0">
                <ShieldCheck className="mb-3 text-primary" size={22} />
                <h3 className="title-md !text-on-dark">{pillar.title}</h3>
                <p className="body-sm mt-2 !text-hairline-soft">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PragueGallery />

      <AIAnswerSection />

      <section className="editorial-section">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="micro-label mb-2 text-muted">Partner Europa</p>
            <h2 className="display-lg mb-4">Scuole, gruppi, hotel e agenzie hanno un canale dedicato.</h2>
            <p className="body-md mb-6">
              Il form B2B raccoglie richieste strutturate con data, numero partecipanti, esigenze logistiche e canale commerciale.
              Le richieste entrano nel flusso operativo per preventivo e approvazione.
            </p>
            <Link className="button-primary" href="/partner-europa">
              Invia richiesta B2B <ArrowRight size={18} />
            </Link>
          </div>
          <div className="card grid gap-4 p-6">
            <CalendarSearch className="text-primary" size={30} />
            <h3 className="display-md">Richieste organizzate, risposte rapide</h3>
            <p className="body-sm">
              Inserisci date, numero partecipanti ed esigenze logistiche: prepariamo una proposta chiara e coordinata per il tuo gruppo.
            </p>
          </div>
        </div>
      </section>

      <TripAdvisorSection />

      <section className="editorial-section bg-surface-soft">
        <div className="container-page">
          <h2 className="display-lg mb-8">Domande operative</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q} className="card p-5">
                <h3 className="title-md mb-2">{faq.q}</h3>
                <p className="body-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
