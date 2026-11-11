import { publicSiteContent } from "@/lib/platform/public";
import { contentWhatsapp } from "@/lib/platform/content";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import { MessageCircle } from "lucide-react";
import "./globals.css";
import { ConsentAndTracking } from "@/components/ConsentAndTracking";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site, whatsappHref } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: {
    default: "FreeTourPraga - Tour guidati in italiano",
    template: "%s | FreeTourPraga",
  },
  description: site.description,
  metadataBase: new URL(site.url),
  applicationName: site.name,
  keywords: site.keywords,
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  alternates: {
    canonical: "/",
    languages: {
      "it-IT": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "FreeTourPraga",
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Ponte Carlo e centro storico di Praga",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FreeTourPraga - Tour guidati in italiano",
    description: site.description,
    images: [
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  category: "travel",
  other: {
    "geo.region": "CZ-10",
    "geo.placename": "Praga",
    "geo.position": `${site.latitude};${site.longitude}`,
    ICBM: `${site.latitude}, ${site.longitude}`,
    "DC.title": "FreeTourPraga - Tour guidati in italiano",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const c = await publicSiteContent();
  return (
    <html lang="it">
      <body
        className="font-sans"
        suppressHydrationWarning
      >
        <a className="skip-link" href="#contenuto">
          Vai al contenuto
        </a>
        <Header />
        <JsonLd
          data={[organizationJsonLd(c.globals), websiteJsonLd(c.globals)]}
        />
        <main id="contenuto">{children}</main>
        <ConsentAndTracking />
        <Footer />
        <a
          className="floating-whatsapp"
          href={contentWhatsapp(
            c,
            "Ciao FreeTourPraga, vorrei un'informazione rapida sui tour in italiano.",
          )}
          aria-label="Apri WhatsApp FreeTourPraga"
        >
          <MessageCircle size={26} />
        </a>
      </body>
    </html>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { globals: g } = await publicSiteContent();
  return {
    ...baseMetadata,
    title: {
      default: `${g.brandName} - Tour guidati in italiano`,
      template: `%s | ${g.brandName}`,
    },
    description: g.description,
    applicationName: g.brandName,
    publisher: g.brandName,
    openGraph: {
      ...baseMetadata.openGraph,
      siteName: g.brandName,
      title: g.brandName,
      description: g.description,
    },
  };
}
