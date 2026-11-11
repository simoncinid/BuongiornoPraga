import { Suspense } from "react";
import { AddedToCartBanner } from "@/components/AddedToCartBanner";
import { JsonLd } from "@/components/JsonLd";
import { TourFilters } from "@/components/TourFilters";
import { catalog, publicPage } from "@/lib/platform/public";
export const dynamic="force-dynamic";
import { absoluteUrl, site } from "@/lib/site";

const baseMetadata = {
  title: "Tour guidati in italiano a Praga",
  description: "Catalogo tour FreeTourPraga in italiano, con disponibilità, gruppi ristretti e assistenza tutti i giorni dalle 9 alle 19.",
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

export default async function TourListingPage() {
 const tours=await catalog(); const content=await publicPage("catalogo");
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
          <h1 className="display-xl mb-4">{content?.title||"Tour guidati in italiano a Praga"}</h1>
          <p className="body-md max-w-2xl">
            {content?.body||"Filtra per esperienza, controlla i posti e prenota con conferma email automatica."}
          </p>
        </div>
        <TourFilters tours={tours} />
      </div>
    </section>
  );
}

export async function generateMetadata(){const p=await publicPage("catalogo");return {...baseMetadata,...(p?.seoTitle?{title:p.seoTitle}:{}),...(p?.seoDescription?{description:p.seoDescription}:{})};}
