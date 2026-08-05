export const site = {
  name: "Buongiorno Praga",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "420000000000",
  email: "prenotazioni@buongiornopraga.com",
  address: "Kaprova 42/14, 11000 Praha - Staré Město",
  city: "Praga",
  region: "Praha",
  country: "CZ",
  latitude: 50.0875,
  longitude: 14.4208,
  tagline: "Goditi Praga con gli occhi, non con lo schermo del telefono. Al resto pensiamo noi.",
  description:
    "Tour guidati in italiano a Praga con gruppi ristretti, prenotazione rapida e assistenza WhatsApp H24.",
  keywords: [
    "tour guidati Praga italiano",
    "guida italiana Praga",
    "tour Praga in italiano",
    "visite guidate Praga",
    "tour privati Praga",
    "tour Castello di Praga italiano",
    "Ponte Carlo tour italiano",
    "assistenza WhatsApp Praga"
  ]
};

export const socialLinks = [
  { label: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "" },
  { label: "Facebook", url: process.env.NEXT_PUBLIC_FACEBOOK_URL || "" },
  { label: "TikTok", url: process.env.NEXT_PUBLIC_TIKTOK_URL || "" },
  { label: "YouTube", url: process.env.NEXT_PUBLIC_YOUTUBE_URL || "" }
].filter((link) => Boolean(link.url));

export const tripAdvisor = {
  profileUrl: process.env.NEXT_PUBLIC_TRIPADVISOR_URL || "",
  widgetHtml: process.env.TRIPADVISOR_WIDGET_HTML || "",
  widgetScriptSrc: process.env.NEXT_PUBLIC_TRIPADVISOR_WIDGET_SCRIPT_SRC || ""
};

export function whatsappHref(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString();
}
