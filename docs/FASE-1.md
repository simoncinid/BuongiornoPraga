> Documento storico, superato il 6 novembre 2026. Per il sistema attuale leggere [Manuale tecnico](MANUALE-TECNICO.md), [copertura contratto](REQUISITI-CONTRATTO.md) e [ipotesi](IPOTESI-E-ATTIVAZIONE.md).

# Fase 1 - Sito Base Indipendente

Questo documento traduce contratto, sintesi strategica e `DESIGN.md` in una consegna tecnica pronta per sviluppo e deploy.

## Step 1 - UX/UI, prototipi e documentazione

- Flusso pubblico: homepage, catalogo tour, scheda tour, booking, conferma.
- Flusso operativo: admin dashboard, gestione tour/orari, calendario, prenotazioni.
- Flusso cliente: conferma email, calendario `.ics`, link self-service sicuro.
- Design applicato da `DESIGN.md`: Vltava Blue brillante come identita, Prague Orange per la conversione, navbar bianca, Sky Canvas azzurrato, card 12px, button 8px, Inter e nav 80px.

## Step 2 - Frontend, SEO/GEO, Maps, social, TripAdvisor, Partner Europa

- Pagine implementate:
  - `/`
  - `/tour`
  - `/tour/[slug]`
  - `/tour-privati`
  - `/partner-europa`
  - `/faq`
  - `/privacy`
  - `/termini`
- SEO Next Metadata configurata per home, listing e dettagli tour.
- Google Maps: link nativi sui punti d'incontro.
- Social/WhatsApp: widget persistente e messaggi contestuali.
- Partner Europa: form B2B strutturato.

## Step 3 - Back-office tour e orari

- `/admin`: KPI, prenotazioni, stato pagamenti, disponibilita.
- `/admin/tour`: contenuti tour, prezzo, durata, slot e capienza.
- `/admin/calendario`: calendario operativo degli slot.
- `/admin/pre-tour`: controllo reminder 24h e link self-service.

## Step 4 - Booking engine e Stripe

- Booking con:
  - tour
  - slot
  - adulti, bambini, infanti
  - controllo disponibilita base
  - contanti o Stripe
  - PNR
  - totale in EUR
- API:
  - `POST /api/bookings`
  - `POST /api/stripe/webhook`
- Se `STRIPE_SECRET_KEY` non e configurata, viene usato un payment link demo locale.

## Step 5 - Email transazionali e calendario

- Email conferma generata in `src/lib/email.ts`.
- Se SMTP non e configurato, l'email viene simulata in console.
- Calendario `.ics` disponibile su `/api/calendar/booking/[pnr]`.
- La conferma include il testo operativo WhatsApp H24 richiesto dalla strategia.

## Step 6 - Messa online, SSL e deploy

- Target: Vercel.
- Configurare variabili `.env`.
- Collegare PostgreSQL.
- Eseguire `npm run db:generate` e `npm run db:push`.
- Deploy con dominio, SSL e webhook Stripe.

## Nota di perimetro

Il contratto colloca Master Inventory, self-service completo, affiliati, OTA parsing e reminder WhatsApp automatici in Fase 2. Questa base include un modulo Pre-Tour e un self-service tokenizzato gia pronto per ridurre il no-show, perche la sintesi strategica lo definisce parte essenziale del flusso cliente.
