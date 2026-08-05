# Architettura tecnica

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- PostgreSQL tramite Prisma
- Stripe Checkout
- SMTP transazionale
- ICS per calendario

## Cartelle principali

- `src/app`: pagine e route API.
- `src/components`: componenti UI riusabili.
- `src/lib`: dati, pricing, booking, email, calendario, Stripe, token.
- `prisma/schema.prisma`: modello dati PostgreSQL.
- `docs`: documentazione di consegna.

## Modalita locale

La prima consegna usa uno store in memoria per consentire test immediati senza database. Lo schema Prisma definisce la struttura di produzione.

## Entita principali

- `Tour`: contenuto pubblico, SEO, prezzo, punto incontro.
- `TourSlot`: data, orario, capienza, posti riservati.
- `Customer`: dati cliente.
- `Booking`: PNR, partecipanti, stato, pagamento, token self-service.
- `OutboxEmail`: storico email transazionali.

## Provider esterni

- Stripe: `STRIPE_SECRET_KEY`, webhook `/api/stripe/webhook`.
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
- WhatsApp: widget diretto in Fase 1; automazione provider in Fase 2.

## Controlli prima del deploy

- Validare testi legali.
- Inserire numero WhatsApp reale.
- Inserire tour, prezzi, meeting point e immagini definitive.
- Attivare PostgreSQL e migrare schema.
- Testare checkout Stripe in test mode.
- Testare invio SMTP.
