import Image from "next/image";
import Link from "next/link";
import { Clock, Footprints, MapPin, Star } from "lucide-react";
import { formatMoney, minutesToLabel } from "@/lib/format";
import type { Tour } from "@/lib/types";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <article className="card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link href={`/tour/${tour.slug}`} className="block">
        <div className="relative aspect-[4/3]">
          <Image src={tour.imageUrl} alt={tour.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
          <span className="absolute left-3 top-3 bg-primary px-2 py-1 text-[9px] font-bold uppercase tracking-[1.3px] text-ink">In evidenza</span>
        </div>
      </Link>
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/tour/${tour.slug}`} className="title-md">
            {tour.title}
          </Link>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ink">
            <Star size={15} fill="#D6AD57" color="#D6AD57" /> {tour.rating}
          </span>
        </div>
        <p className="body-sm line-clamp-2">{tour.shortDescription}</p>
        <div className="grid gap-2 text-sm text-muted">
          <span className="flex items-center gap-2"><Clock size={16} /> {minutesToLabel(tour.durationMinutes)}</span>
          <span className="flex items-center gap-2"><MapPin size={16} /> {tour.meetingPoint}</span>
          <span className="flex items-center gap-2" aria-label={`Difficoltà a piedi: ${tour.walkingDifficulty} su 5`}><Footprints size={16} /> A piedi <span className="ml-1 flex gap-0.5">{Array.from({ length: 5 }, (_, index) => <Footprints key={index} size={14} className={index < tour.walkingDifficulty ? "text-primary" : "text-hairline"} fill="currentColor" />)}</span></span>
        </div>
        <div className="flex items-center justify-between border-t border-hairline-soft pt-3">
          <span className="text-sm text-muted">
            da <strong className="text-base text-ink">{formatMoney(tour.basePriceCents)}</strong>
          </span>
          <Link href={`/tour/${tour.slug}`} className="button-secondary !min-h-0 !px-3 !py-2 text-[10px]">
            Scopri
          </Link>
        </div>
      </div>
    </article>
  );
}
