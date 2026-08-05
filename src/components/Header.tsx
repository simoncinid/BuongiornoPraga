import Link from "next/link";
import { Menu, MessageCircle, UserRound } from "lucide-react";
import { CartBadge } from "@/components/CartBadge";
import { whatsappHref } from "@/lib/site";

const links = [
  { href: "/tour", label: "Tour" },
  { href: "/tour-privati", label: "Tour privati" },
  { href: "/partner-europa", label: "Partner Europa" },
  { href: "/faq", label: "FAQ" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-navy text-on-dark shadow-[0_4px_18px_rgba(7,26,53,0.18)]">
      <div className="container-page flex h-[74px] items-center justify-between gap-6">
        <Link href="/" className="font-display text-[25px] leading-none tracking-tight text-white">
          Buongiorno <span className="text-primary">Praga</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/account" aria-label="Area cliente" className="text-primary"><UserRound size={19} /></Link>
          <CartBadge />
          <a href={whatsappHref("Ciao Buongiorno Praga, vorrei un'informazione sui tour.")} className="button-pill-primary max-md:!hidden md:inline-flex !border !border-primary/60 !bg-transparent !px-5 !py-2 !text-primary">
            <MessageCircle size={15} /> WhatsApp
          </a>
          <button className="button-secondary !min-h-10 !rounded-full !border-primary/60 !bg-transparent !px-3 !py-2 !text-primary md:hidden" aria-label="Menu">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
