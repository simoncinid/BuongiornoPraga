import {publicPage} from "@/lib/platform/public";
import {ContentBlock} from "@/components/ContentBlock";
export const dynamic="force-dynamic";
import { Building2, Users, Handshake } from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";
const baseMetadata = {
  title: "Partner Europa",
  description: "Tour in italiano per scuole, gruppi, hotel e agenzie a Praga.",
  alternates: { canonical: "/partner-europa" },
};
export default async function Page() {
 const page=await publicPage("partner-europa"); if(page)return <><ContentBlock page={page}/><div className="container-page mb-16 max-w-3xl"><InquiryForm partner/></div></>;
  return (
    <section className="section">
      <div className="container-page grid items-start gap-16 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="uppercase-tag mb-4 text-primary">Partner Europa</p>
          <h1 className="display-xl mb-5">
            Grandi esperienze.
            <br />
            Organizzate insieme.
          </h1>
          <p className="body-md mb-10">
            Scuole in viaggio, gruppi da accompagnare, ospiti da consigliare:
            siamo il tuo riferimento locale per scoprire Praga in italiano.
          </p>
          {[
            [
              Users,
              "Scuole e gruppi",
              "Itinerari e ritmi adatti a chi viaggia insieme.",
            ],
            [
              Building2,
              "Hotel e agenzie",
              "Un contatto dedicato per organizzare le visite dei tuoi ospiti.",
            ],
            [
              Handshake,
              "Collabora con noi",
              "Affiliazioni e codici per riconoscere le prenotazioni dei tuoi clienti.",
            ],
          ].map(([Icon, title, text]) => (
            <div key={String(title)} className="mb-7 flex gap-4">
              <Icon className="shrink-0 text-navy" size={24} />
              <div>
                <h2 className="title-md mb-2">{String(title)}</h2>
                <p className="body-sm">{String(text)}</p>
              </div>
            </div>
          ))}
        </div>
        <InquiryForm partner />
      </div>
    </section>
  );
}

export async function generateMetadata(){const p=await publicPage("partner-europa");return {...baseMetadata,...(p?.seoTitle?{title:p.seoTitle}:{}),...(p?.seoDescription?{description:p.seoDescription}:{})};}
