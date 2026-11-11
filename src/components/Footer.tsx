import Link from "next/link";
import { publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";
import { SocialLinks } from "./SocialLinks";
export async function Footer() {
  const c = await publicSiteContent();
  const g = c.globals;
  return (
    <footer className="border-t-4 border-primary bg-navy text-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div>
          <strong className="font-display text-2xl">{g.brandName}</strong>
          <p className="mt-4 text-sm text-white/85">{g.footerText}</p>
        </div>
        <div>
          <h2 className="mb-4 font-bold text-white">Contatti</h2>
          <div className="grid gap-3 text-sm text-white/85">
            <a href={contentWhatsapp(c, "Ciao, vorrei assistenza sui tour.")}>
              WhatsApp · {g.supportHours}
            </a>
            <a href={`mailto:${g.email}`}>{g.email}</a>
            <a href={`tel:${g.phone.replaceAll(" ", "")}`}>{g.phone}</a>
            <p>{g.address}</p>
          </div>
        </div>
        <div>
          <h2 className="mb-4 font-bold text-white">Informazioni</h2>
          <div className="mb-5 grid gap-3 text-sm">
            {g.navigation.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
            <Link href="/faq">Domande frequenti</Link>
            <Link href="/privacy">Privacy e cookie</Link>
            <Link href="/termini">Termini e cancellazioni</Link>
          </div>
          <SocialLinks compact />
        </div>
      </div>
      <div className="border-t border-white/10 py-5">
        <p className="container-page text-sm text-white/80">{g.footerNote}</p>
      </div>
    </footer>
  );
}
