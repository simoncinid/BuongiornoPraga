import { Clock, Edit, MapPin, Plus } from "lucide-react";
import { tours } from "@/lib/data";
import { formatDateTime, formatMoney, minutesToLabel } from "@/lib/format";
import { availableSeats } from "@/lib/pricing";

export const metadata = {
  title: "Tour e orari"
};

export default function AdminTourPage() {
  return (
    <section className="bg-surface-soft py-8">
      <div className="container-page grid gap-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="micro-label text-muted">Gestione autonoma</p>
            <h1 className="display-lg">Tour, contenuti, orari e disponibilita</h1>
          </div>
          <button className="button-primary w-fit"><Plus size={18} /> Nuovo tour</button>
        </div>
        <div className="grid gap-5">
          {tours.map((tour) => (
            <article key={tour.id} className="card p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="status-chip status-success">pubblicato</span>
                    <span className="status-chip status-muted">{tour.category}</span>
                  </div>
                  <h2 className="display-md mb-2">{tour.title}</h2>
                  <p className="body-sm mb-4">{tour.shortDescription}</p>
                  <div className="grid gap-2 text-sm text-muted md:grid-cols-3">
                    <span className="flex gap-2"><Clock size={16} /> {minutesToLabel(tour.durationMinutes)}</span>
                    <span className="flex gap-2"><MapPin size={16} /> {tour.meetingPoint}</span>
                    <span>Prezzo adulto {formatMoney(tour.basePriceCents)}</span>
                  </div>
                  <button className="button-secondary mt-5"><Edit size={18} /> Modifica contenuti</button>
                </div>
                <div className="rounded-sm bg-surface-soft p-4">
                  <h3 className="title-md mb-3">Slot orari</h3>
                  <div className="grid gap-2">
                    {tour.slots.map((slot) => (
                      <div key={slot.id} className="flex justify-between rounded-sm bg-surface-card p-3 text-sm">
                        <span>{formatDateTime(slot.startsAt)}</span>
                        <strong>{availableSeats(slot.capacity, slot.reserved)} / {slot.capacity}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
