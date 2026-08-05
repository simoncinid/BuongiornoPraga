import { Link2, MessageCircle } from "lucide-react";
import { bookings } from "@/lib/booking-store";
import { formatDateTime } from "@/lib/format";

export const metadata = {
  title: "Pre-Tour Anti-No-Show"
};

export const dynamic = "force-dynamic";

export default function AdminPreTourPage() {
  return (
    <section className="bg-surface-soft py-8">
      <div className="container-page grid gap-6">
        <div>
          <p className="micro-label text-muted">Fase cliente Pre-Tour</p>
          <h1 className="display-lg">Reminder 24h e token self-service</h1>
          <p className="body-md max-w-3xl">
            Vista operativa per controllare le prenotazioni che riceveranno messaggio WhatsApp con link sicuro. L'invio automatico richiede provider WhatsApp come Twilio.
          </p>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>PNR</th>
                <th>Cliente</th>
                <th>Tour</th>
                <th>Quando</th>
                <th>Self-service</th>
                <th>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length ? bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.pnr}</td>
                  <td>{booking.name}<br /><span className="text-sm text-muted">{booking.phone}</span></td>
                  <td>{booking.tourTitle}</td>
                  <td>{formatDateTime(booking.startsAt)}</td>
                  <td><a className="text-legal-link" href={booking.selfServiceUrl}><Link2 size={16} /> Apri link</a></td>
                  <td><a className="text-legal-link" href={`https://wa.me/${booking.phone}?text=${encodeURIComponent(`Ciao ${booking.name}, ti ricordiamo il tour ${booking.tourTitle}. Puoi gestire la prenotazione qui: ${booking.selfServiceUrl}`)}`}><MessageCircle size={16} /> Prepara messaggio</a></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center text-muted">Nessuna prenotazione in sessione locale.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
