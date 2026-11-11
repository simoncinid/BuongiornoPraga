"use client";
import { useState } from "react";
import Script from "next/script";

export function TripAdvisorWidget({
  tripAdvisor,
}: {
  tripAdvisor: {
    profileUrl: string;
    title?: string;
    body?: string;
    widgetHtml: string;
    widgetScriptSrc: string;
  };
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <section className="section bg-surface-soft">
      <div className="container-page grid gap-8 lg:grid-cols-2">
        <div>
          <p className="micro-label text-primary">TripAdvisor</p>
          <h2 className="display-lg my-4">
            {tripAdvisor.title || "Le esperienze di chi è già partito."}
          </h2>
          <p>
            {tripAdvisor.body ||
              "Consulta le recensioni sul profilo TripAdvisor prima di scegliere il tuo tour."}
          </p>
        </div>
        <div className="card grid gap-5 p-7">
          {tripAdvisor.widgetHtml && loaded ? (
            <>
              <div
                dangerouslySetInnerHTML={{ __html: tripAdvisor.widgetHtml }}
              />
              {tripAdvisor.widgetScriptSrc && (
                <Script
                  src={tripAdvisor.widgetScriptSrc}
                  strategy="lazyOnload"
                />
              )}
            </>
          ) : (
            <>
              <p>
                Leggi i racconti dei viaggiatori sul nostro profilo pubblico.
              </p>
              {tripAdvisor.widgetScriptSrc && (
                <button
                  className="button-secondary"
                  onClick={() => setLoaded(true)}
                >
                  Carica widget TripAdvisor
                </button>
              )}
            </>
          )}
          <a
            href={tripAdvisor.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="button-secondary"
          >
            Vedi recensioni TripAdvisor
          </a>
        </div>
      </div>
    </section>
  );
}
