import { ExternalLink, MapPin } from "lucide-react";
import type { Tour } from "@/lib/types";

export function GoogleMap({ tour }: { tour: Tour }) {
  return (
    <section className="card overflow-hidden">
      <div className="grid gap-2 p-6">
        <div className="flex items-start gap-3">
          <MapPin className="mt-1 shrink-0 text-vltava-blue" size={24} />
          <div>
            <h2 className="display-md">Punto d'incontro su Google Maps</h2>
            <p className="body-sm mt-2">{tour.meetingAddress}</p>
          </div>
        </div>
      </div>
      <div className="aspect-[4/3] border-y border-hairline-soft md:aspect-[16/7]">
        <iframe
          title={`Mappa Google Maps - ${tour.title}`}
          src={tour.mapEmbedUrl}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <span className="body-sm">Coordinate: {tour.latitude.toFixed(4)}, {tour.longitude.toFixed(4)}</span>
        <a href={tour.mapUrl} target="_blank" rel="noreferrer" className="button-secondary !min-h-10 !px-4">
          Apri Google Maps <ExternalLink size={16} />
        </a>
      </div>
    </section>
  );
}
