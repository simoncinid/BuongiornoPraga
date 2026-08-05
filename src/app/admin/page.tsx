import Link from "next/link";
import { CalendarDays, CreditCard, LayoutDashboard, Plus, Settings, Users } from "lucide-react";
import { bookings } from "@/lib/booking-store";
import { tours } from "@/lib/data";
import { formatDateTime, formatMoney } from "@/lib/format";
import { availableSeats } from "@/lib/pricing";

export const metadata = {
  title: "Gestionale",
  description: "Dashboard operativa Buongiorno Praga per tour, slot, prenotazioni e pagamenti."
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const confirmed = bookings.filter((booking) => booking.status === "confirmed").length;
  const revenue = bookings.reduce((sum, booking) => sum + (booking.status !== "cancelled" ? booking.totalCents : 0), 0);
  const totalSlots = tours.reduce((sum, tour) => sum + tour.slots.length, 0);

  return (
    <section className="bg-surface-soft py-8">
      <div className="container-page grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="card h-fit p-4">
          <div className="mb-6 flex items-center gap-2 text-ink">
            <LayoutDashboard size={20} />
            <strong>Gestionale</strong>
          </div>
          <nav className="grid gap-2 text-sm">
            <Link className="rounded-sm bg-navy px-3 py-2 text-on-dark" href="/admin">Dashboard</Link>
            <Link className="rounded-sm px-3 py-2 text-ink hover:bg-surface-soft" href="/admin/tour">Tour e orari</Link>
            <Link className="rounded-sm px-3 py-2 text-ink hover:bg-surface-soft" href="/admin/calendario">Calendario</Link>
            <Link className="rounded-sm px-3 py-2 text-ink hover:bg-surface-soft" href="/admin/pre-tour">Pre-Tour</Link>
          </nav>
        </aside>
        <div className="grid gap-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="micro-label text-muted">Operativita</p>
              <h1 className="display-lg">Dashboard operativa</h1>
            </div>
            <Link className="button-primary w-fit" href="/admin/tour">
              <Plus size={18} /> Gestisci tour
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Kpi icon={<CalendarDays size={22} />} label="Slot attivi" value={String(totalSlots)} />
            <Kpi icon={<Users size={22} />} label="Prenotazioni" value={String(bookings.length)} />
            <Kpi icon={<CreditCard size={22} />} label="Confermate" value={String(confirmed)} />
            <Kpi icon={<Settings size={22} />} label="Fatturato lordo" value={formatMoney(revenue)} />
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PNR</th>
                  <th>Cliente</th>
                  <th>Tour</th>
                  <th>Data</th>
                  <th>Pagamento</th>
                  <th>Stato</th>
                  <th>Totale</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length ? (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td><Link className="font-semibold text-legal-link" href={`/prenotazione/${booking.pnr}`}>{booking.pnr}</Link></td>
                      <td>{booking.name}<br /><span className="text-sm text-muted">{booking.email}</span></td>
                      <td>{booking.tourTitle}</td>
                      <td>{formatDateTime(booking.startsAt)}</td>
                      <td>{booking.paymentMethod} / {booking.paymentStatus}</td>
                      <td><span className="status-chip status-warning">{booking.status}</span></td>
                      <td>{formatMoney(booking.totalCents)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">Nessuna prenotazione ancora registrata in questa sessione locale.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {tours.map((tour) => (
              <div key={tour.id} className="card p-5">
                <h2 className="title-md mb-3">{tour.title}</h2>
                <div className="grid gap-2">
                  {tour.slots.map((slot) => (
                    <div key={slot.id} className="flex justify-between border-b border-hairline-soft py-2 text-sm">
                      <span>{formatDateTime(slot.startsAt)}</span>
                      <strong>{availableSeats(slot.capacity, slot.reserved)} posti</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong text-ink">{icon}</div>
      <p className="micro-label text-muted">{label}</p>
      <strong className="display-md block">{value}</strong>
    </div>
  );
}
