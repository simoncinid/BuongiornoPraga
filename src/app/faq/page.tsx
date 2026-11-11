import { publicSiteContent } from "@/lib/platform/public";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/seo";
import { publicPage } from "@/lib/platform/public";
import { ContentBlock } from "@/components/ContentBlock";
export const dynamic = "force-dynamic";
const baseMetadata = {
  title: "Domande frequenti",
  alternates: { canonical: "/faq" },
};
export default async function Page() {
  const page = await publicPage("faq");
  const c = await publicSiteContent();
  const faqs = c.faqs;
  if (page) return <ContentBlock page={page} />;
  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <JsonLd data={faqJsonLd(faqs)} />
        <h1 className="display-xl mb-8">{c.home.faqTitle}</h1>
        {faqs.map((f) => (
          <details key={f.q} className="card mb-4 p-6">
            <summary className="font-bold cursor-pointer">{f.q}</summary>
            <p className="mt-4">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata() {
  const p = await publicPage("faq");
  return {
    ...baseMetadata,
    ...(p?.seoTitle ? { title: p.seoTitle } : {}),
    ...(p?.seoDescription ? { description: p.seoDescription } : {}),
  };
}
