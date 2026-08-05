import { faqs } from "@/lib/data";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/seo";

export const metadata = {
  title: "FAQ",
  description: "Domande frequenti su tour, pagamenti, cancellazioni e assistenza Buongiorno Praga.",
  alternates: {
    canonical: "/faq"
  }
};

export default function FaqPage() {
  return (
    <section className="section">
      <JsonLd data={faqJsonLd()} />
      <div className="container-page max-w-3xl">
        <p className="micro-label mb-2 text-muted">FAQ</p>
        <h1 className="display-xl mb-8">Domande operative</h1>
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <article key={faq.q} className="card p-6">
              <h2 className="display-md mb-2">{faq.q}</h2>
              <p className="body-md">{faq.a}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
