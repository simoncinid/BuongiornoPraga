"use client";
import { useState } from "react";
import type { Tour } from "@/lib/types";
export function GoogleMap({ tour }: { tour: Tour }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <section className="card overflow-hidden">
      <div className="grid gap-3 p-6">
        <h2 className="display-md">Il punto d’incontro</h2>
        <p>
          {tour.meetingPoint} · {tour.meetingAddress}
        </p>
      </div>
      <div className="aspect-[4/3] border-y md:aspect-[16/7]">
        {loaded ? (
          <iframe
            title={`Mappa di ${tour.title}`}
            src={tour.mapEmbedUrl}
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer"
            allowFullScreen
          />
        ) : (
          <div className="grid h-full place-content-center gap-4 p-6 text-center">
            <p className="text-sm">
              Caricando la mappa condividi dati di navigazione con Google.
            </p>
            <button
              className="button-secondary"
              onClick={() => setLoaded(true)}
            >
              Mostra Google Maps
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-3 p-5">
        <span className="text-sm">
          {tour.latitude.toFixed(4)}, {tour.longitude.toFixed(4)}
        </span>
        <a
          className="underline"
          href={tour.mapUrl}
          target="_blank"
          rel="noreferrer"
        >
          Apri le indicazioni
        </a>
      </div>
    </section>
  );
}
