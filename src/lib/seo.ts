import { absoluteUrl, site, socialLinks } from "./site";
import type { Tour } from "./types";
import { faqs } from "./data";

export function organizationJsonLd(global?: {
  brandName: string;
  email: string;
  address: string;
  description: string;
  socialLinks: { url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${site.url}/#organization`,
    name: global?.brandName || site.name,
    url: site.url,
    description: global?.description || site.description,
    email: global?.email || site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: global?.address || site.address,
      addressLocality: "Praha - Staré Město",
      postalCode: "11000",
      addressCountry: "CZ",
    },
    areaServed: {
      "@type": "City",
      name: "Praga",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.latitude,
      longitude: site.longitude,
    },
    knowsLanguage: ["it", "it-IT"],
    sameAs: (global?.socialLinks || socialLinks).map((link) => link.url),
  };
}

export function websiteJsonLd(global?: { brandName: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: global?.brandName || site.name,
    url: site.url,
    inLanguage: "it-IT",
    publisher: {
      "@id": `${site.url}/#organization`,
    },
  };
}

export function tourJsonLd(tour: Tour) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${absoluteUrl(`/tour/${tour.slug}`)}#tour`,
    name: tour.title,
    description: tour.seoDescription || tour.shortDescription,
    image: tour.imageUrl,
    url: absoluteUrl(`/tour/${tour.slug}`),
    inLanguage: "it-IT",
    touristType: "Italian travelers in Prague",
    provider: {
      "@id": `${site.url}/#organization`,
    },
    offers: {
      "@type": "Offer",
      price: (tour.basePriceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/tour/${tour.slug}`),
    },
    itinerary: {
      "@type": "ItemList",
      itemListElement: tour.highlights.map((highlight, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: highlight,
      })),
    },
    location: {
      "@type": "Place",
      name: tour.meetingPoint,
      address: tour.meetingAddress,
      geo: {
        "@type": "GeoCoordinates",
        latitude: tour.latitude,
        longitude: tour.longitude,
      },
      hasMap: tour.mapUrl,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqJsonLd(items = faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
