import { Suspense } from "react";
import { AddedToCartBanner } from "@/components/AddedToCartBanner";
import { JsonLd } from "@/components/JsonLd";
import { TourFilters } from "@/components/TourFilters";
import { tours } from "@/lib/data";
import { absoluteUrl, site } from "@/lib/site";

export const metadata = {
  title: "Tour guidati in italiano a Praga",
  description: "Catalogo tour Buongiorno Praga con disponibilita, gruppi ristretti e assistenza WhatsApp H24.",
  keywords: [
    ...site.keywords,
    "catalogo tour Praga",
    "prenotare tour Praga",
    "tour Praga famiglie",
    "tour Praga piccoli gruppi"
  ],
  alternates: {
    canonical: "/tour"
  },
  openGraph: {
    title: "Tour guidati in italiano a Praga",
    description: "Catalogo tour in italiano a Praga con gruppi ristretti, disponibilita e assistenza WhatsApp.",
    url: absoluteUrl("/tour"),
    type: "website",
    locale: "it_IT"
  }
};

export default function TourListingPage() {
  return (
    <section className="section">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Tour guidati in italiano a Praga",
          itemListElement: tours.map((tour, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(`/tour/${tour.slug}`),
            name: tour.title
          }))
        }}
      />
      <div className="container-page">
        <Suspense fallback={null}>
          <AddedToCartBanner />
        </Suspense>
        <div className="mb-8">
          <p className="micro-label mb-2 text-muted">Catalogo tour</p>
          <h1 className="display-xl mb-4">Tour guidati in italiano a Praga</h1>
          <p className="body-md max-w-2xl">
            Filtra per esperienza, controlla i posti e prenota con conferma email automatica.
          </p>
        </div>
        <TourFilters tours={tours} />
      </div>
    </section>
  );
}
