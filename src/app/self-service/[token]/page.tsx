import { notFound } from "next/navigation";
import { findBookingByPnr } from "@/lib/booking-store";
import { formatDateTime } from "@/lib/format";
import { verifySelfServiceToken } from "@/lib/tokens";
import { SelfServiceActions } from "./self-service-actions";

type Props = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

export default async function SelfServicePage({ params }: Props) {
  const { token } = await params;
  const verified = verifySelfServiceToken(token);
  if (!verified) notFound();
  const booking = findBookingByPnr(verified.pnr);
  if (!booking) notFound();

  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <p className="micro-label mb-2 text-muted">Area self-service sicura</p>
        <h1 className="display-xl mb-4">Gestisci prenotazione {booking.pnr}</h1>
        <div className="card shadow-card grid gap-4 p-6">
          <p className="body-md">
            {booking.tourTitle}, {formatDateTime(booking.startsAt)}, {booking.totalGuests} partecipanti.
          </p>
          <p className="body-sm">
            Questo link permette di richiedere modifica o cancellazione e libera immediatamente i posti in caso di cancellazione confermata.
          </p>
          <SelfServiceActions pnr={booking.pnr} />
        </div>
      </div>
    </section>
  );
}
