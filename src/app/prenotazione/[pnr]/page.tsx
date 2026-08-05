import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CreditCard, MessageCircle } from "lucide-react";
import { findBookingByPnr } from "@/lib/booking-store";
import { formatDateTime, formatMoney } from "@/lib/format";
import { whatsappHref } from "@/lib/site";

type Props = { params: Promise<{ pnr: string }> };

export const dynamic = "force-dynamic";

export default async function BookingSummaryPage({ params }: Props) {
  const { pnr } = await params;
  const booking = findBookingByPnr(pnr);
  if (!booking) notFound();

  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <span className="status-chip status-success mb-4">{booking.status}</span>
        <h1 className="display-xl mb-4">Prenotazione {booking.pnr}</h1>
        <div className="card shadow-card grid gap-4 p-6">
          <div className="grid gap-2">
            <strong className="title-md">{booking.tourTitle}</strong>
            <span className="body-sm">{formatDateTime(booking.startsAt)}</span>
            <span className="body-sm">{booking.totalGuests} partecipanti</span>
            <span className="body-sm">Totale {formatMoney(booking.totalCents)}</span>
            <span className="body-sm">Pagamento {booking.paymentMethod} - {booking.paymentStatus}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {booking.stripePaymentUrl ? (
              <a className="button-primary" href={booking.stripePaymentUrl}>
                <CreditCard size={18} /> Paga con Stripe
              </a>
            ) : null}
            <a className="button-secondary" href={booking.calendarUrl}>
              <CalendarDays size={18} /> Aggiungi calendario
            </a>
            <a className="button-secondary" href={whatsappHref(`Ciao Buongiorno Praga, ho bisogno di aiuto sulla prenotazione ${booking.pnr}.`)}>
              <MessageCircle size={18} /> WhatsApp
            </a>
            <Link className="button-secondary" href={booking.selfServiceUrl}>
              Modifica o cancella
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
