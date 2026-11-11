import { faqs, trustPillars } from "../data";
import { aiQuestions } from "../ai-content";
import { site, socialLinks, tripAdvisor } from "../site";
export type SiteContent = {
  globals: {
    brandName: string;
    description: string;
    email: string;
    phone: string;
    whatsappNumber: string;
    address: string;
    supportHours: string;
    footerText: string;
    footerNote: string;
    tripAdvisorUrl: string;
    tripAdvisorTitle: string;
    tripAdvisorBody: string;
    socialLinks: { label: string; url: string }[];
    navigation: { label: string; href: string }[];
  };
  home: {
    heroImage: string;
    heroTitle: string;
    heroEyebrow: string;
    heroBody: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    toursEyebrow: string;
    toursTitle: string;
    toursBody: string;
    trustEyebrow: string;
    trustTitle: string;
    trustBody: string;
    galleryEyebrow: string;
    galleryTitle: string;
    galleryBody: string;
    answersTitle: string;
    answersBody: string;
    partnerEyebrow: string;
    partnerTitle: string;
    partnerBody: string;
    partnerLabel: string;
    faqTitle: string;
    stats: { value: string; label: string }[];
    pillars: { title: string; text: string }[];
  };
  gallery: { title: string; caption: string; imageUrl: string }[];
  faqs: { q: string; a: string }[];
  answers: { question: string; answer: string }[];
};
export function defaultSiteContent(): SiteContent {
  return {
    globals: {
      brandName: site.name,
      description: site.description,
      email: site.email,
      phone: site.phone,
      whatsappNumber: site.whatsappNumber,
      address: site.address,
      supportHours: site.supportHours,
      footerText:
        "Tour guidati in italiano, gruppi ristretti e prenotazione semplice.",
      footerNote:
        "Un riferimento locale prima, durante e dopo il tuo viaggio a Praga.",
      tripAdvisorUrl: tripAdvisor.profileUrl,
      tripAdvisorTitle: "Le esperienze di chi è già partito.",
      tripAdvisorBody:
        "Consulta le recensioni dei viaggiatori sul nostro profilo TripAdvisor.",
      socialLinks: structuredClone(socialLinks),
      navigation: [
        { label: "Tour", href: "/tour" },
        { label: "Tour privati", href: "/tour-privati" },
        { label: "Partner Europa", href: "/partner-europa" },
        { label: "Contatti", href: "/contatti" },
      ],
    },
    home: {
      heroImage:
        "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1800&q=85",
      heroTitle: "Vivi Praga, senza pensieri.",
      heroEyebrow: "Tour guidati in italiano a Praga",
      heroBody:
        "Scopri la storia, i quartieri e i luoghi simbolo della capitale ceca con una guida in italiano. Prenotazione semplice, conferma via email e assistenza locale.",
      primaryLabel: "Vedi tour disponibili",
      primaryHref: "/tour",
      secondaryLabel: "Scrivi su WhatsApp",
      toursEyebrow: "Esperienze selezionate",
      toursTitle: "La città, a modo tuo",
      toursBody: "Esperienze in italiano con guide locali.",
      trustEyebrow: "Perché sceglierci",
      trustTitle: "Non sei solo un turista. Sei nostro ospite.",
      trustBody:
        "Conosciamo Praga e vogliamo farti scoprire la sua anima autentica.",
      galleryEyebrow: "Praga da scoprire",
      galleryTitle: "La città, con i tuoi occhi.",
      galleryBody:
        "Luoghi iconici e quartieri storici da esplorare con una guida locale.",
      answersTitle: "Le informazioni essenziali, scritte in modo chiaro.",
      answersBody: "Le risposte pratiche da conoscere prima di prenotare.",
      partnerEyebrow: "Partner Europa",
      partnerTitle: "Scuole, gruppi, hotel e agenzie hanno un canale dedicato.",
      partnerBody:
        "Organizzi un viaggio di gruppo o vuoi consigliare un’esperienza ai tuoi ospiti? Raccontaci cosa hai in mente.",
      partnerLabel: "Invia richiesta B2B",
      faqTitle: "Domande frequenti",
      stats: [
        { value: "Italiano", label: "Guide locali" },
        { value: "Piccoli gruppi", label: "Capienza controllata" },
        { value: "Prenota online", label: "Conferma via email" },
        { value: "Un riferimento", label: "Assistenza locale" },
      ],
      pillars: structuredClone(trustPillars),
    },
    gallery: [
      {
        title: "Ponte Carlo",
        caption: "Tra il centro storico e le rive della Moldava.",
        imageUrl:
          "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "Castello e Malá Strana",
        caption: "Panorami e vicoli storici.",
        imageUrl:
          "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "Cultura della birra ceca",
        caption: "Storie e tradizioni da conoscere insieme.",
        imageUrl:
          "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    faqs: structuredClone(faqs),
    answers: structuredClone(aiQuestions),
  };
}
export function siteContent(stored?: SiteContent): SiteContent {
  const base = defaultSiteContent();
  return stored
    ? {
        ...base,
        ...stored,
        globals: { ...base.globals, ...stored.globals },
        home: { ...base.home, ...stored.home },
      }
    : base;
}
export function contentWhatsapp(content: SiteContent, message: string) {
  return `https://wa.me/${content.globals.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
