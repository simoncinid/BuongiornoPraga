import { publicSiteContent, publicPage } from "@/lib/platform/public";
import { ContentBlock } from "@/components/ContentBlock";
export const dynamic = "force-dynamic";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";
import { site, whatsappHref } from "@/lib/site";
const baseMetadata = {
  title: "Contatti",
  description:
    "Contatta il team FreeTourPraga per informazioni sui tour in italiano.",
  alternates: { canonical: "/contatti" },
};
export default async function Page() {
  const c = await publicSiteContent();
  const site = c.globals;
  const whatsappHref = (m: string) =>
    `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(m)}`;
  const page = await publicPage("contatti");
  if (page)
    return (
      <>
        <ContentBlock page={page} />
        <div className="container-page mb-16 max-w-3xl">
          <InquiryForm />
        </div>
      </>
    );
  return (
    <section className="section">
      <div className="container-page grid gap-16 lg:grid-cols-2">
        <div>
          <p className="uppercase-tag mb-4 text-primary">
            Un consiglio da chi vive qui
          </p>
          <h1 className="display-xl mb-6">
            Praga è più vicina
            <br />
            di quanto pensi.
          </h1>
          <p className="body-md mb-10 max-w-md">
            Un dubbio sul tour, sul punto d’incontro o sull’esperienza giusta
            per te? Parliamone: siamo qui per aiutarti a organizzare la visita.
          </p>
          <div className="grid gap-6">
            <a
              className="flex items-center gap-4"
              href={whatsappHref("Ciao, vorrei informazioni sui tour.")}
            >
              <MessageCircle className="text-navy" />
              <span>
                <strong className="block text-ink">Scrivici su WhatsApp</strong>
                <small>
                  {site.phone} · {site.supportHours}
                </small>
              </span>
            </a>
            <a
              className="flex items-center gap-4"
              href={`mailto:${site.email}`}
            >
              <Mail className="text-navy" />
              <span>
                <strong className="block text-ink">Email</strong>
                <small>{site.email}</small>
              </span>
            </a>
            <div className="flex items-center gap-4">
              <MapPin className="text-navy" />
              <span>
                <strong className="block text-ink">
                  Punto d’incontro principale
                </strong>
                <small>{site.address}</small>
              </span>
            </div>
          </div>
        </div>
        <InquiryForm />
      </div>
    </section>
  );
}

export async function generateMetadata() {
  const p = await publicPage("contatti");
  return {
    ...baseMetadata,
    ...(p?.seoTitle ? { title: p.seoTitle } : {}),
    ...(p?.seoDescription ? { description: p.seoDescription } : {}),
  };
}
