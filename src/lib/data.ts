import {pragueInstant} from "./platform/time";
import type { Tour } from "./types";

const today = new Date(new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Prague"})+"T12:00:00Z");

function googleMapUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function googleMapEmbed(latitude: number, longitude: number) {
  return `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
}

function slot(id: string, tourId: string, dayOffset: number, hour: number, capacity = 14, reserved = 0) {
  const day = new Date(today);
  day.setUTCDate(day.getUTCDate()+dayOffset);
  const starts = new Date(pragueInstant(`${day.toISOString().slice(0,10)}T${String(hour).padStart(2,'0')}:00`));
  const ends = new Date(starts.getTime()+2*3600000);

  return {
    id,
    tourId,
    startsAt: starts.toISOString(),
    endsAt: ends.toISOString(),
    capacity,
    reserved
  };
}

export const tours: Tour[] = [
  {
    id: "old-town",
    slug: "citta-vecchia-ponte-carlo",
    title: "Citta Vecchia e Ponte Carlo senza stress",
    category: "Classico",
    shortDescription:
      "Il primo orientamento protetto a Praga: luoghi iconici, trappole da evitare e punto d'incontro geolocalizzato.",
    description:
      "Un tour pensato per chi arriva a Praga e vuole capire subito come muoversi senza perdere tempo tra mappe, cambi sfavorevoli e itinerari improvvisati. La guida racconta Piazza della Citta Vecchia, Orologio Astronomico, quartiere ebraico esterno e Ponte Carlo con ritmo calmo, spiegazioni in italiano e consigli pratici anti-truffa.",
    imageUrl:
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1400&q=80",
    meetingPoint: "Piazza della Citta Vecchia",
    meetingAddress: "Staromestske namesti, 110 00 Praha 1",
    mapUrl: googleMapUrl("Staromestske namesti, Prague"),
    mapEmbedUrl: googleMapEmbed(50.0870, 14.4212),
    latitude: 50.0870,
    longitude: 14.4212,
    durationMinutes: 150,
    basePriceCents: 2900,
    childPriceCents: 1600,
    infantPriceCents: 0,
    maxGuests: 14,
    walkingDifficulty: 2,
    rating: 4.9,
    reviewCount: 312,
    language: "Italiano",
    seoTitle: "Tour Citta Vecchia e Ponte Carlo in italiano",
    seoDescription:
      "Tour guidato in italiano tra Città Vecchia, Orologio Astronomico e Ponte Carlo con gruppo ristretto e informazioni prima della visita.",
    seoKeywords: [
      "tour Citta Vecchia Praga italiano",
      "Ponte Carlo guida italiana",
      "Orologio Astronomico tour italiano",
      "tour Praga centro storico"
    ],
    highlights: [
      "Ponte Carlo con contesto storico e fotografico",
      "Quartiere ebraico esterno senza code inutili",
      "Consigli anti-cambio e ATM Euronet",
      "Ritmo adatto a famiglie e prime visite"
    ],
    inclusions: [
      "Guida italiana o italofona locale",
      "Gruppo ristretto a numero chiuso",
      "Assistenza WhatsApp tutti i giorni, 9:00–19:00",
      "Coordinate native del punto d'incontro"
    ],
    safetyNotes: [
      "Transazioni in euro senza commissioni nascoste",
      "Suggerimenti pratici per cambio sicuro",
      "Punto d'incontro verificato e condiviso prima del tour"
    ],
    slots: [
      slot("old-town-1", "old-town", 1, 10, 14, 5),
      slot("old-town-2", "old-town", 2, 15, 14, 2),
      slot("old-town-3", "old-town", 3, 10, 14, 11),
      slot("old-town-4", "old-town", 5, 15, 14, 0)
    ]
  },
  {
    id: "castle",
    slug: "castello-praga-mala-strana",
    title: "Castello di Praga e Mala Strana",
    category: "Premium",
    shortDescription:
      "Il percorso panoramico per capire potere, leggende e scorci del Castello senza finire nei flussi di massa.",
    description:
      "Un tour premium tra Castello di Praga, cortili, Cattedrale di San Vito dall'esterno, vicoli di Mala Strana e punti panoramici. Il percorso evita gli orari piu caotici quando possibile e aiuta il viaggiatore italiano a leggere la citta senza dipendere dal telefono.",
    imageUrl:
      "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1400&q=80",
    meetingPoint: "Malostranska",
    meetingAddress: "Malostranska metro, Praha 1",
    mapUrl: googleMapUrl("Malostranska metro, Prague"),
    mapEmbedUrl: googleMapEmbed(50.0911, 14.4094),
    latitude: 50.0911,
    longitude: 14.4094,
    durationMinutes: 180,
    basePriceCents: 3900,
    childPriceCents: 2100,
    infantPriceCents: 0,
    maxGuests: 12,
    walkingDifficulty: 4,
    rating: 4.8,
    reviewCount: 204,
    language: "Italiano",
    seoTitle: "Tour Castello di Praga e Mala Strana in italiano",
    seoDescription:
      "Visita guidata in italiano al Castello di Praga e Mala Strana con percorso panoramico, gruppo ristretto e punto d'incontro geolocalizzato.",
    seoKeywords: [
      "tour Castello di Praga italiano",
      "Mala Strana guida italiana",
      "visita Castello Praga",
      "tour panoramico Praga"
    ],
    highlights: [
      "Castello e panorami senza percorso improvvisato",
      "Mala Strana con racconti e contesto locale",
      "Gruppo piu piccolo per ascoltare bene la guida",
      "Perfetto dopo il tour base della Citta Vecchia"
    ],
    inclusions: [
      "Guida italiana o italofona locale",
      "Link mappa a un tocco",
      "Assistenza WhatsApp tutti i giorni, 9:00–19:00",
      "Consigli per ristoranti e rientro"
    ],
    safetyNotes: [
      "Percorso verificato per ridurre code e caos",
      "Indicazioni chiare per mezzi pubblici",
      "Cancellazione flessibile secondo policy"
    ],
    slots: [
      slot("castle-1", "castle", 1, 14, 12, 4),
      slot("castle-2", "castle", 3, 9, 12, 1),
      slot("castle-3", "castle", 4, 14, 12, 8)
    ]
  },
  {
    id: "beer",
    slug: "birra-ceca-storie-locali",
    title: "Birra ceca e storie locali",
    category: "Esperienza",
    shortDescription:
      "Un'esperienza serale conviviale, ordinata e in italiano tra cultura brassicola e locali selezionati.",
    description:
      "La birra a Praga non e solo una bevanda: e cultura, socialita e identita cittadina. Questo percorso accompagna piccoli gruppi in locali selezionati, con racconto storico e attenzione logistica per evitare trappole turistiche e sovrapprezzi.",
    imageUrl:
      "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&w=1400&q=80",
    meetingPoint: "Namesti Republiky",
    meetingAddress: "Namesti Republiky, 110 00 Praha 1",
    mapUrl: googleMapUrl("Namesti Republiky, Prague"),
    mapEmbedUrl: googleMapEmbed(50.0878, 14.4287),
    latitude: 50.0878,
    longitude: 14.4287,
    durationMinutes: 150,
    basePriceCents: 3400,
    childPriceCents: 0,
    infantPriceCents: 0,
    maxGuests: 10,
    walkingDifficulty: 1,
    rating: 4.9,
    reviewCount: 146,
    language: "Italiano",
    seoTitle: "Tour birra ceca e locali storici a Praga in italiano",
    seoDescription:
      "Esperienza serale in italiano sulla birra ceca a Praga con locali selezionati, gruppo piccolo e supporto WhatsApp.",
    seoKeywords: [
      "tour birra Praga italiano",
      "birrerie storiche Praga",
      "esperienza birra ceca",
      "Praga sera tour italiano"
    ],
    highlights: [
      "Locali selezionati e facili da raggiungere",
      "Contesto culturale sulla birra ceca",
      "Consigli pratici per evitare locali turistici",
      "Gruppo piccolo e atmosfera ordinata"
    ],
    inclusions: [
      "Guida italiana o italofona locale",
      "Prenotazione coordinata del percorso",
      "Assistenza WhatsApp tutti i giorni, 9:00–19:00",
      "Indicazioni per rientrare in hotel"
    ],
    safetyNotes: [
      "Tour non adatto a minori non accompagnati",
      "Prezzi e tappe comunicati con chiarezza",
      "Supporto logistico prima e dopo l'esperienza"
    ],
    slots: [
      slot("beer-1", "beer", 2, 18, 10, 3),
      slot("beer-2", "beer", 4, 18, 10, 6),
      slot("beer-3", "beer", 6, 18, 10, 0)
    ]
  }
];

export const trustPillars = [
  {
    title: "Scudo anti-truffe",
    text: "Cambio sicuro, ATM da evitare e pagamenti chiari in euro prima che il problema si presenti."
  },
  {
    title: "Gruppi ristretti",
    text: "Numero chiuso per ascoltare la guida, fare domande e non sentirsi trascinati da una folla."
  },
  {
    title: "Addio Google Maps",
    text: "Punti d'incontro geolocalizzati, email di conferma e indicazioni native da aprire con un tocco."
  },
  {
    title: "WhatsApp ogni giorno",
    text: "Il servizio clienti risponde dalle 9:00 alle 19:00 per informazioni e richieste sui tour."
  }
];

export const faqs = [
  {
    q: "Posso pagare in contanti sul posto?",
    a: "Sì. Puoi scegliere contanti sul posto oppure carta tramite link sicuro Stripe. Ricevi la conferma email con il riepilogo."
  },
  {
    q: "I gruppi sono davvero a numero chiuso?",
    a: "Si. Ogni slot ha una capienza operativa. La piattaforma mostra i posti disponibili e blocca le vendite quando non ci sono posti sufficienti."
  },
  {
    q: "Come ricevo il punto d'incontro?",
    a: "La conferma include indirizzo, link Google Maps e contatto WhatsApp. Per modificare o cancellare usa il link della singola prenotazione ricevuto via email, senza account, oppure contatta lo staff."
  },
  {
    q: "La pagina Partner Europa e per chi?",
    a: "Hotel, travel blogger, scuole, gruppi e agenzie possono inviare richieste strutturate e attivare collaborazioni tracciabili."
  }
];

export function getTourBySlug(slug: string) {
  return tours.find((tour) => tour.slug === slug);
}

export function getSlot(slotId: string) {
  for (const tour of tours) {
    const found = tour.slots.find((candidate) => candidate.id === slotId);
    if (found) return { tour, slot: found };
  }
  return null;
}
