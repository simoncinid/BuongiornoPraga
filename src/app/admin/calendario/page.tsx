import { bookings } from "@/lib/booking-store";
import { tours } from "@/lib/data";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";

export const metadata = {
  title: "Calendario operativo"
};

export const dynamic = "force-dynamic";

export default function AdminCalendarPage() {
  const slots = tours
    .flatMap((tour) => tour.slots.map((slot) => ({ tour, slot })))
    .sort((a, b) => new Date(a.slot.startsAt).getTime() - new Date(b.slot.startsAt).getTime());

  return (
    <section className="bg-surface-soft py-8">
      <div className="container-page">
        <p className="micro-label text-muted">Calendario</p>
        <h1 className="display-lg mb-6">Operativita prossimi slot</h1>
        <div className="grid gap-4">
          {slots.map(({ tour, slot }) => {
            const slotBookings = bookings.filter((booking) => booking.slotId === slot.id);
            return (
              <div key={slot.id} className="card p-5">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <h2 className="title-md">{tour.title}</h2>
                    <p className="body-sm">{formatDate(slot.startsAt)} alle {formatTime(slot.startsAt)} - {tour.meetingPoint}</p>
                  </div>
                  <span className="status-chip status-muted">{slotBookings.length} prenotazioni</span>
                </div>
                <div className="mt-4 grid gap-2">
                  {slotBookings.length ? (
                    slotBookings.map((booking) => (
                      <div key={booking.id} className="rounded-sm bg-surface-soft p-3 text-sm">
                        <strong>{booking.name}</strong> - {booking.totalGuests} ospiti - {booking.status} - {formatDateTime(booking.startsAt)}
                      </div>
                    ))
                  ) : (
                    <p className="body-sm">Nessuna prenotazione in questo slot.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
