import Link from "next/link";
import { MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { site, whatsappHref } from "@/lib/site";
import { SocialLinks } from "./SocialLinks";

export function Footer() {
  return (
    <footer className="border-t-4 border-primary bg-navy text-on-dark">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
              <ShieldCheck size={22} />
            </span>
            <strong>Buongiorno Praga</strong>
          </div>
          <p className="body-sm !text-hairline-soft">
            Tour guidati in italiano, gruppi ristretti, prenotazione rapida e assistenza WhatsApp H24 per non sentirti mai isolato a Praga.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-[15px] font-semibold">Servizi</h3>
          <div className="grid gap-2 text-sm text-hairline-soft">
            <Link href="/tour">Tour pubblici</Link>
            <Link href="/tour-privati">Tour privati</Link>
            <Link href="/partner-europa">Scuole e partner</Link>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-[15px] font-semibold">Contatti</h3>
          <div className="grid gap-2 text-sm text-hairline-soft">
            <a className="flex gap-2" href={whatsappHref("Ciao Buongiorno Praga, ho bisogno di assistenza.")}>
              <MessageCircle size={17} /> WhatsApp H24
            </a>
            <a className="flex gap-2" href={`mailto:${site.email}`}>{site.email}</a>
            <span className="flex gap-2"><MapPin size={17} /> {site.address}</span>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-[15px] font-semibold">Legale</h3>
          <div className="grid gap-2 text-sm text-hairline-soft">
            <Link href="/privacy">Privacy</Link>
            <Link href="/termini">Termini e cancellazioni</Link>
            <Link href="/faq">FAQ operative</Link>
          </div>
          <div className="mt-5">
            <SocialLinks compact />
          </div>
        </div>
      </div>
      <div className="bg-navy-soft py-4">
        <div className="container-page text-[13px] leading-snug text-hairline-soft">
          Buongiorno Praga accompagna viaggiatori italiani con tour guidati, supporto locale e informazioni operative prima, durante e dopo il soggiorno.
        </div>
      </div>
    </footer>
  );
}
