import Script from "next/script";
import { ExternalLink, Star } from "lucide-react";
import { tripAdvisor } from "@/lib/site";

export function TripAdvisorSection() {
  return (
    <section className="section bg-surface-soft">
      <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="micro-label mb-2 text-muted">TripAdvisor</p>
          <h2 className="display-lg mb-4">Recensioni di viaggiatori italiani che hanno scelto una guida locale.</h2>
          <p className="body-md">
            La reputazione conta quando prenoti un'esperienza in viaggio. Qui raccogliamo segnali verificabili su puntualita, chiarezza, organizzazione e supporto prima del tour.
          </p>
        </div>
        <div className="card shadow-card p-6">
          {tripAdvisor.widgetHtml ? (
            <>
              <div dangerouslySetInnerHTML={{ __html: tripAdvisor.widgetHtml }} />
              {tripAdvisor.widgetScriptSrc ? <Script src={tripAdvisor.widgetScriptSrc} strategy="lazyOnload" /> : null}
            </>
          ) : (
            <div className="grid gap-5">
              <div className="flex items-center gap-2 text-star-rating">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={24} fill="#FF8A00" color="#FF8A00" />
                ))}
              </div>
              <div>
                <strong className="display-md block">Eccellente per organizzazione e supporto</strong>
                <p className="body-sm mt-2">
                  Le recensioni aiutano a scegliere con piu serenita: puntualita, guide in italiano, gruppi ristretti e assistenza pratica sono i segnali che monitoriamo con piu attenzione.
                </p>
              </div>
              {tripAdvisor.profileUrl ? (
                <a href={tripAdvisor.profileUrl} target="_blank" rel="noreferrer" className="button-secondary w-fit">
                  Vedi recensioni TripAdvisor <ExternalLink size={16} />
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
