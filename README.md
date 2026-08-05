# Buongiorno Praga - Fase 1

Piattaforma Next.js per vendita e gestione tour guidati a Praga.

## Avvio locale

```bash
npm install
cp .env.example .env
npm run dev
```

Apri `http://localhost:3000`.

## Fase 1 inclusa

- Frontend pubblico responsive con SEO, tour, trust strip, FAQ, Partner Europa, contatti e WhatsApp persistente.
- Booking engine con fasce eta, disponibilita, scelta contanti o Stripe payment link.
- Back-office per tour, slot, prenotazioni, calendario operativo e stato pagamenti.
- Email transazionali con contenuto operativo WhatsApp H24.
- Feed calendario `.ics` per lo staff.
- Documentazione tecnica, schema database PostgreSQL/Prisma e variabili ambiente.
- Modulo Pre-Tour con token self-service e reminder preparato come estensione operativa.

## Produzione

1. Configura `DATABASE_URL`, SMTP, Stripe e numero WhatsApp.
2. Esegui `npm run db:generate` e `npm run db:push`.
3. Pubblica su Vercel collegando le variabili ambiente.
4. Imposta il webhook Stripe su `/api/stripe/webhook`.
