import { notFound } from "next/navigation";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { CheckoutWizard } from "@/components/CheckoutWizard";
import { getTourBySlug } from "@/lib/data";

type Props = {
  searchParams: Promise<{
    pnr?: string;
    amount?: string;
    tour?: string;
    slot?: string;
    adults?: string;
    children?: string;
  }>;
};

export const metadata = {
  title: "Acquisto",
  alternates: {
    canonical: "/pagamento"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default async function PaymentPage({ searchParams }: Props) {
  const params = await searchParams;
  const tour = params.tour ? getTourBySlug(params.tour) : undefined;
  const slot = tour?.slots.find((item) => item.id === params.slot);
  const adults = Number(params.adults || 1);
  const children = Number(params.children || 0);

  if (tour && slot) {
    return (
      <section className="section bg-surface-soft">
        <div className="container-page max-w-5xl">
          <CheckoutWizard tour={tour} slot={slot} adults={adults} children={children} />
        </div>
      </section>
    );
  }

  if (params.pnr) {
    return (
      <section className="section">
        <div className="container-page max-w-2xl">
          <div className="card shadow-card grid gap-4 p-6">
            <CreditCard className="text-primary" size={32} />
            <h1 className="display-lg">Pagamento online</h1>
            <p className="body-md">Completa il pagamento della prenotazione in modo sicuro. Dopo la conferma riceverai il riepilogo aggiornato via email.</p>
            <p className="body-sm">PNR: {params.pnr} · Importo centesimi: {params.amount || "0"}</p>
            <Link className="button-primary" href={`/prenotazione/${params.pnr}?payment=success`}>
              Conferma pagamento
            </Link>
          </div>
        </div>
      </section>
    );
  }

  notFound();
}
