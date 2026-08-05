import Link from "next/link";
import { ArrowRight, Clock, ShieldCheck, Users } from "lucide-react";

export const metadata = {
  title: "Tour privati a Praga",
  description: "Tour privati in italiano per famiglie, coppie, scuole, aziende e agenzie.",
  alternates: {
    canonical: "/tour-privati"
  }
};

export default function PrivateToursPage() {
  return (
    <section className="section">
      <div className="container-page">
        <div className="private-copy">
          <p className="micro-label mb-2 text-muted">Tour privati</p>
          <h1 className="display-xl private-headline mb-4">Percorsi su misura senza frizione logistica.</h1>
          <p className="body-md private-description mb-8">
            Per famiglie, coppie, scuole e agenzie che vogliono una guida italiana, orari adattati e un riferimento operativo prima del tour.
          </p>
          <Link href="/partner-europa" className="button-primary">
            Richiedi preventivo <ArrowRight size={18} />
          </Link>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            [Users, "Ritmo adatto al gruppo", "Percorsi calibrati su eta, mobilita e priorita."],
            [Clock, "Orari flessibili", "Partenza e durata concordate in base al soggiorno."],
            [ShieldCheck, "Supporto H24", "WhatsApp operativo per dubbi e cambi logistici."]
          ].map(([Icon, title, text]) => (
            <div key={title as string} className="card p-6">
              <Icon className="mb-3 text-primary" size={26} />
              <h2 className="title-md mb-2">{title as string}</h2>
              <p className="body-sm">{text as string}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
