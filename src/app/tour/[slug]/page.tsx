import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { BookingForm } from "@/components/BookingForm";
import { GoogleMap } from "@/components/GoogleMap";
import { TripAdvisorSection } from "@/components/TripAdvisorSection";
import { JsonLd } from "@/components/JsonLd";
import { publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";
import { catalog } from "@/lib/platform/public";
export const dynamic = "force-dynamic";
import { formatMoney, minutesToLabel } from "@/lib/format";
import { absoluteUrl, site, whatsappHref } from "@/lib/site";
import { breadcrumbJsonLd, tourJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = (await catalog()).find((t) => t.slug === slug);
  if (!tour) return {};
  return {
    title: tour.seoTitle || tour.title,
    description: tour.seoDescription || tour.shortDescription,
    keywords: [...site.keywords, ...(tour.seoKeywords || [])],
    alternates: {
      canonical: `/tour/${tour.slug}`,
    },
    openGraph: {
      title: tour.seoTitle || tour.title,
      description: tour.seoDescription || tour.shortDescription,
      url: absoluteUrl(`/tour/${tour.slug}`),
      type: "article",
      locale: "it_IT",
      images: [
        {
          url: tour.imageUrl,
          width: 1200,
          height: 800,
          alt: `${tour.title} - FreeTourPraga`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: tour.seoTitle || tour.title,
      description: tour.seoDescription || tour.shortDescription,
      images: [tour.imageUrl],
    },
    other: {
      "geo.region": "CZ-10",
      "geo.placename": tour.meetingPoint,
      "geo.position": `${tour.latitude};${tour.longitude}`,
      ICBM: `${tour.latitude}, ${tour.longitude}`,
    },
  };
}

export default async function TourDetailPage({ params }: Props) {
  const { slug } = await params;
  const tour = (await catalog()).find((t) => t.slug === slug);
  if (!tour) notFound();
  const content = await publicSiteContent();
  const whatsappHref = (m: string) => contentWhatsapp(content, m);

  return (
    <section className="pb-20 pt-10">
      <JsonLd
        data={[
          tourJsonLd(tour),
          breadcrumbJsonLd([
            { name: "Home", url: site.url },
            { name: "Tour", url: absoluteUrl("/tour") },
            { name: tour.title, url: absoluteUrl(`/tour/${tour.slug}`) },
          ]),
        ]}
      />
      <div className="container-page">
        <div className="mb-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="micro-label mb-3 text-primary">
              Praga · {tour.category}
            </p>
            <h1 className="display-xl tour-detail-title mb-3">{tour.title}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Clock3 size={15} /> {minutesToLabel(tour.durationMinutes)}
              </span>
              <span className="flex items-center gap-1">
                <Users size={15} /> Guida in {tour.language}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-left lg:text-right">
            <span className="block text-sm text-muted">A partire da</span>
            <strong className="font-display text-4xl text-primary">
              {formatMoney(tour.basePriceCents)}
            </strong>
          </div>
        </div>

        <div className="relative mb-10 aspect-[16/10] overflow-hidden rounded-xl md:aspect-[21/9]">
          <Image
            src={tour.imageUrl}
            alt={tour.title}
            fill
            priority
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="mb-8 border-b border-hairline pb-4 text-sm font-semibold text-ink">
          <a href="#esperienza" className="mr-7 border-b-2 border-primary pb-4">
            Descrizione
          </a>
          <a href="#dettagli" className="mr-7">
            Dettagli
          </a>
          <a href="#incontro">Punto d&apos;incontro</a>
        </div>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-10">
            <section id="esperienza">
              <div className="mb-7 border-l-2 border-primary bg-surface-soft p-6">
                <p className="micro-label mb-2 text-muted">In breve</p>
                <p className="body-md">
                  {tour.title} e un tour guidato in italiano a Praga con gruppo
                  ristretto, punto d'incontro su Google Maps, assistenza
                  WhatsApp e prezzo adulto da {formatMoney(tour.basePriceCents)}
                  .
                </p>
              </div>
              <h2 className="display-md mb-4">L&apos;esperienza</h2>
              <p className="body-md">{tour.description}</p>
            </section>
            <section id="dettagli">
              <h2 className="display-md mb-4">Cosa vedrai</h2>
              <div className="grid gap-3">
                {tour.highlights.map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 border-b border-hairline-soft py-4"
                  >
                    <CheckCircle2 className="shrink-0 text-primary" size={22} />
                    <span className="body-md">{item}</span>
                  </div>
                ))}
              </div>
            </section>
            <section id="incontro" className="grid gap-4 md:grid-cols-2">
              <div className="card p-6">
                <ShieldCheck className="mb-3 text-primary" size={26} />
                <h2 className="display-md mb-4">Incluso</h2>
                <ul className="grid gap-3">
                  {tour.inclusions.map((item) => (
                    <li key={item} className="body-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-6">
                <p className="micro-label mb-2 text-muted">Prima di partire</p>
                <h2 className="display-md mb-4">Informazioni pratiche</h2>
                <ul className="grid gap-3">
                  {tour.safetyNotes.map((note) => (
                    <li key={note} className="body-sm">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <GoogleMap tour={tour} />
            <section className="bg-navy p-7 text-on-dark">
              <MessageCircle className="mb-3 text-whatsapp" size={26} />
              <h2 className="display-md mb-3 !text-on-dark">
                Hai un dubbio prima di prenotare?
              </h2>
              <p className="body-sm mb-5 !text-hairline-soft">
                Scrivici: nel messaggio troveremo gia il nome del tour, cosi
                possiamo risponderti piu rapidamente.
              </p>
              <a
                className="button-primary !bg-whatsapp hover:!bg-[#1fb75a]"
                href={whatsappHref(
                  `Ciao FreeTourPraga, mi trovo nella pagina del tour ${tour.title} e vorrei un'informazione rapida sulla disponibilita.`,
                )}
              >
                Scrivi su WhatsApp
              </a>
            </section>
            <TripAdvisorSection />
          </div>
          <BookingForm tour={tour} />
        </div>
      </div>
    </section>
  );
}
