import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { MessageCircle } from "lucide-react";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site, whatsappHref } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: {
    default: "Buongiorno Praga - Tour guidati in italiano",
    template: "%s | Buongiorno Praga"
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
      "it-IT": "/"
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    title: "Buongiorno Praga",
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
        alt: "Ponte Carlo e centro storico di Praga"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Buongiorno Praga - Tour guidati in italiano",
    description: site.description,
    images: ["https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1200&q=80"]
  },
  category: "travel",
  other: {
    "geo.region": "CZ-10",
    "geo.placename": "Praga",
    "geo.position": `${site.latitude};${site.longitude}`,
    ICBM: `${site.latitude}, ${site.longitude}`,
    "DC.title": "Buongiorno Praga - Tour guidati in italiano"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
        <Header />
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <main>{children}</main>
        <Footer />
        <a
          className="floating-whatsapp"
          href={whatsappHref("Ciao Buongiorno Praga, vorrei un'informazione rapida sui tour in italiano.")}
          aria-label="Apri WhatsApp Buongiorno Praga"
        >
          <MessageCircle size={26} />
        </a>
      </body>
    </html>
  );
}
