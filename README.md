# FreeTourPraga — piattaforma tour

> **Stato di consegna: non ancora completo e collaudato rispetto al contratto ufficiale.** Leggere [il rapporto tecnico aggiornato](docs/STATO-CONSEGNA.md), che distingue sviluppo, test locali e attività mancanti.

Implementazione locale delle due fasi di `freetour-praga-contratto.pdf`: sito responsive, booking multi-tour, gestionale, inventario condiviso, checkout senza account, Stripe, email/ICS, affiliati/QR, import OTA, reminder WhatsApp e KPI.

```bash
npm ci
npm run setup:local
npm run dev
```

- **Sito:** http://localhost:3100
- **Gestionale:** http://localhost:3100/accesso
- **Accesso solo locale:** `admin@freetourpraga.local` / `PragaLocale!2026`

L'anteprima conserva realmente i dati su file locale. In produzione usa PostgreSQL con transazioni. Nessun pagamento o invio esterno viene dichiarato riuscito senza il provider configurato.

## Documentazione

- [Copertura di ogni requisito contrattuale](docs/REQUISITI-CONTRATTO.md)
- [Ipotesi adottate e attivazione](docs/IPOTESI-E-ATTIVAZIONE.md)
- [Manuale tecnico, operativo e deploy](docs/MANUALE-TECNICO.md)
- [Piano Google Ads](docs/GOOGLE-ADS.md)
- [Risultati e limiti del collaudo](docs/COLLAUDO.md)

## Verifica

```bash
npm run typecheck
npm test
node scripts/test-postgres.mjs
npm audit --audit-level=moderate
npm run build
npm run test:http
```

Stack: Next.js/React/TypeScript/Tailwind, PostgreSQL/Prisma, Stripe, SMTP, Twilio e IMAP. Deploy predisposto per **GitHub + Vercel + Render + DigitalOcean** con CI, migrazione, worker, immagini Spaces e backup cifrato giornaliero.

**Stato esterno:** non pubblicato; account, dominio, database e credenziali non sono stati provisionati. Servono accessi e collaudi reali per attivare pagamenti, messaggi, import OTA, backup e campagne. Le precedenti note “solo frontend Fase 1” sono storiche e sono superate dalla documentazione sopra.

## Precisazione: sito pubblico e carrello browser

Non esistono area cliente, registrazione o login per i viaggiatori. Il carrello è salvato in `localStorage` nel browser/dispositivo utilizzato. Il riepilogo dopo il checkout è disponibile nella stessa scheda tramite una ricevuta temporanea (`sessionStorage`), senza account. L’email contiene un link protetto limitato alla singola prenotazione per cambio partenza, cancellazione e consenso reminder. L’accesso con password riguarda solo il gestionale.

- **Sconto e cancellazione:** `/admin/impostazioni`, percentuale/soglia tour e ore/rimborso.
- **Fasce d’età e tariffe:** `/admin/tour`, per ciascun tour.
- Le impostazioni sono persistite e usate dal motore server; i valori iniziali non sono vincoli fissi.

Il CMS globale è in `/admin/sito`: home, FAQ, galleria, contatti, social e footer. `npm run test:http:production` collauda il bundle standalone su PostgreSQL temporaneo; `npm run preflight` verifica la configurazione dei servizi, senza provarne il funzionamento reale.
