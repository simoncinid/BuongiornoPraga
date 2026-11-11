import Link from "next/link";
import { Menu, MessageCircle } from "lucide-react";
import { CartBadge } from "@/components/CartBadge";
import { publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";

export async function Header() {
  const c = await publicSiteContent();
  const links = c.globals.navigation;
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-navy text-on-dark shadow-[0_4px_18px_rgba(7,26,53,0.18)]">
      <div className="container-page flex h-[74px] items-center justify-between gap-6">
        <Link
          href="/"
          className="font-display text-[25px] leading-none tracking-tight text-white"
        >
          {c.globals.brandName}
        </Link>
        <nav className="hidden items-center gap-5 xl:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <CartBadge />
          <a
            href={contentWhatsapp(
              c,
              "Ciao FreeTourPraga, vorrei un'informazione sui tour.",
            )}
            className="button-pill-primary max-lg:!hidden lg:inline-flex !border !border-primary/60 !bg-transparent !px-5 !py-2 !text-primary"
          >
            <MessageCircle size={15} /> WhatsApp
          </a>
          <details className="relative xl:hidden">
            <summary
              className="cursor-pointer list-none rounded-full border border-white/40 p-2"
              aria-label="Menu"
            >
              <Menu size={20} />
            </summary>
            <nav className="absolute right-0 top-12 grid w-56 gap-1 rounded-lg border border-hairline bg-white p-3 text-ink shadow-card">
              {links.map((link) => (
                <Link
                  className="rounded-sm px-3 py-3 hover:bg-surface-soft"
                  key={link.href}
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
