import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { TourCard } from "@/components/TourCard";
import { JsonLd } from "@/components/JsonLd";
import { TripAdvisorSection } from "@/components/TripAdvisorSection";
import { catalog, publicPage, publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";
import { faqJsonLd } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function HomePage() {
  const [tours, page, c] = await Promise.all([
    catalog(),
    publicPage("homepage"),
    publicSiteContent(),
  ]);
  const h = c.home;
  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image
          src={h.heroImage}
          alt="Praga"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="hero-overlay" aria-hidden />
        <div className="container-page relative z-10 grid min-h-[570px] items-center py-20">
          <div className="max-w-2xl">
            <p className="uppercase-tag mb-5 text-primary">
              {page?.subtitle || h.heroEyebrow}
            </p>
            <h1 className="display-xl hero-title mb-5 !text-white">
              {page?.title || h.heroTitle}
            </h1>
            <p className="body-md mb-8 max-w-xl !text-white/90">
              {page?.body || h.heroBody}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={h.primaryHref} className="button-primary">
                {h.primaryLabel}
                <ArrowRight size={18} />
              </Link>
              <a
                className="button-secondary hero-cta"
                href={contentWhatsapp(
                  c,
                  "Ciao, vorrei informazioni sui tour in italiano.",
                )}
              >
                <MessageCircle size={18} />
                {h.secondaryLabel}
              </a>
            </div>
          </div>
        </div>
      </section>
      {h.stats.length > 0 && (
        <section className="border-b bg-white py-8">
          <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {h.stats.map((s, i) => (
              <div key={i} className="text-center">
                <strong className="block text-ink">{s.value}</strong>
                <span className="text-sm text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="editorial-section">
        <div className="container-page">
          <p className="uppercase-tag mb-3 text-primary">{h.toursEyebrow}</p>
          <h2 className="display-lg mb-3">{h.toursTitle}</h2>
          <p className="body-md mb-8">{h.toursBody}</p>
          <div className="grid gap-5 md:grid-cols-3">
            {tours.map((t) => (
              <TourCard key={t.id} tour={t} />
            ))}
          </div>
        </div>
      </section>
      <section className="editorial-section bg-navy text-on-dark">
        <div className="container-page grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="uppercase-tag mb-3 text-primary">{h.trustEyebrow}</p>
            <h2 className="display-lg !text-white">{h.trustTitle}</h2>
            <p className="body-md mt-5 !text-white/85">{h.trustBody}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {h.pillars.map((p, i) => (
              <article key={i} className="border-b border-white/20 py-4">
                <ShieldCheck size={24} className="mb-4 text-primary" />
                <h3 className="title-md !text-white">{p.title}</h3>
                <p className="body-sm mt-3 !text-white/80">{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      {c.gallery.length > 0 && (
        <section className="editorial-section">
          <div className="container-page">
            <p className="uppercase-tag mb-3 text-primary">
              {h.galleryEyebrow}
            </p>
            <h2 className="display-lg mb-3">{h.galleryTitle}</h2>
            <p className="body-md mb-8">{h.galleryBody}</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {c.gallery.map((photo, i) => (
                <figure className="card overflow-hidden" key={i}>
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={photo.imageUrl}
                      alt={photo.title}
                      fill
                      sizes="(min-width:1024px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="p-5">
                    <strong className="title-md">{photo.title}</strong>
                    <p className="body-sm mt-2">{photo.caption}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
      {c.answers.length > 0 && (
        <section className="editorial-section bg-surface-soft">
          <div className="container-page">
            <h2 className="display-lg mb-4">{h.answersTitle}</h2>
            <p className="body-md mb-8">{h.answersBody}</p>
            <div className="grid gap-5 md:grid-cols-2">
              {c.answers.map((a, i) => (
                <article key={i} className="card p-6">
                  <h3 className="title-md">{a.question}</h3>
                  <p className="body-sm mt-3">{a.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="editorial-section">
        <div className="container-page max-w-4xl">
          <p className="uppercase-tag mb-3 text-primary">{h.partnerEyebrow}</p>
          <h2 className="display-lg mb-4">{h.partnerTitle}</h2>
          <p className="body-md mb-6">{h.partnerBody}</p>
          <Link href="/partner-europa" className="button-primary">
            {h.partnerLabel}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <TripAdvisorSection />
      {c.faqs.length > 0 && (
        <section className="editorial-section">
          <div className="container-page max-w-4xl">
            <JsonLd data={faqJsonLd(c.faqs)} />
            <h2 className="display-lg mb-7">{h.faqTitle}</h2>
            <div className="grid gap-4">
              {c.faqs.map((f, i) => (
                <details key={i} className="card p-5">
                  <summary className="cursor-pointer font-bold text-ink">
                    {f.q}
                  </summary>
                  <p className="body-md mt-4">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
export async function generateMetadata() {
  const [p, c] = await Promise.all([
    publicPage("homepage"),
    publicSiteContent(),
  ]);
  return {
    title: p?.seoTitle || `${c.globals.brandName} - Tour guidati in italiano`,
    description: p?.seoDescription || c.globals.description,
  };
}
