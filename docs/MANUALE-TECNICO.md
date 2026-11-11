# Manuale tecnico e operativo

Versione: 6 novembre 2026. Fonte dei requisiti: `freetour-praga-contratto.pdf`. Vedere anche [matrice requisiti](REQUISITI-CONTRATTO.md) e [ipotesi](IPOTESI-E-ATTIVAZIONE.md).

## Architettura

Next.js 16, React 19, TypeScript, Tailwind. Rendering server per catalogo e contenuti, Route Handlers Node per le operazioni, PostgreSQL con Prisma, Stripe Checkout, SMTP, Twilio WhatsApp, IMAP. Backend e frontend sono un'unica applicazione, pubblicabile su Vercel; Render esegue il worker; DigitalOcean ospita database, immagini e backup.

Il livello applicativo attivo è `src/lib/platform/`. Le vecchie librerie `booking-store`, `calendar`, `email`, `tokens`, `stripe` e alcuni componenti storici restano nel repository per conservare il lavoro preesistente ma non alimentano il nuovo flusso. Prezzi unitari, sconti e policy di cancellazione vengono fotografati alla prenotazione; le modifiche alle regole valgono per i nuovi ordini. Lo staff può correggere contatti e partecipanti delle prenotazioni cash non saldate con ricalcolo e controllo capienza; per prenotazioni pagate/OTA deve prima gestire l’adeguamento con il provider. Gli endpoint precedenti `/api/bookings*` e `/api/admin/*` rispondono 410: non espongono più lo store in memoria.

### Persistenza e consistenza

`PlatformState`, tabella PostgreSQL con documento JSONB versionato, conserva catalogo, inventario, prenotazioni, ordini, affiliati, pagine, outbox, import, audit e limiti richieste. Ogni mutazione avviene in una transazione con `SELECT ... FOR UPDATE` sulla riga della piattaforma. Controllo posti, prezzi, creazione prenotazione e inserimento outbox fanno parte dello stesso commit. La concorrenza funziona anche tra più istanze Vercel e worker. I vecchi modelli relazionali Prisma sono conservati per compatibilità storica ma non ricevono scritture dal nuovo servizio.

Questa scelta offre consistenza semplice per un operatore turistico con volumi contenuti. Non è un'architettura a throughput illimitato: tutte le scritture si serializzano e il documento cresce con lo storico. Misurare tempi e dimensioni; prima di volumi elevati o più organizzazioni, migrare i gruppi di entità a tabelle indicizzate e lock per singola partenza, mantenendo i test delle invarianti. L'amministrazione carica attualmente lo storico completo: introdurre paginazione server prima di grandi archivi. Le query pubbliche non espongono dati di prenotazione.

In sviluppo il medesimo servizio usa `.data/platform.json`, scrittura temporanea e rename atomico, con serializzazione nel singolo processo Node. Non usare due processi sullo stesso file. `NODE_ENV=production` rifiuta questa modalità.

### Struttura del codice

| File                                 | Responsabilità                                                   |
| ------------------------------------ | ---------------------------------------------------------------- |
| `platform/model.ts`                  | Tipi di dominio                                                  |
| `platform/store.ts`                  | Persistenza, transazioni, seed e audit                           |
| `platform/validation.ts`             | Contratti Zod per tutti i dati in ingresso                       |
| `platform/security.ts`               | Sessioni, password, autorizzazioni, origini, limiti richieste    |
| `platform/booking.ts`                | Prezzi, inventario, ordini, modifiche, cancellazioni e notifiche |
| `platform/providers.ts`              | Stripe, webhook, invio SMTP/Twilio, rimborsi e retry             |
| `platform/ota.ts`                    | Lettura casella, parser e coda revisione                         |
| `platform/maintenance.ts`            | Scadenze dati personali                                          |
| `platform/media.ts`                  | Upload immagini, re-encoding e storage Spaces                    |
| `platform/public.ts`                 | Dati pubblici condivisi per rendering server                     |
| `platform/time.ts`                   | Conversione orari Prague/UTC                                     |
| `components/AdminWorkspace.tsx`      | Gestionale operativo                                             |
| `components/ReservationFlow.tsx`     | Carrello e checkout effettivo                                    |
| `components/BookingConfirmation.tsx` | Ricevuta del checkout, in sola lettura nella scheda del browser  |

## Avvio e verifica

Usare Node 22 o superiore compatibile con i pacchetti bloccati nel lockfile.

```bash
npm ci
npm run setup:local
npm run dev
```

Anteprima su http://localhost:3100. La directory di build di sviluppo è `.next-platform`, separata da `.next` per non interferire con un server già esistente nel progetto. La password locale documentata in `IPOTESI-E-ATTIVAZIONE.md` serve solo allo sviluppo. Per la build:

```bash
npm run typecheck
npm test
node scripts/test-postgres.mjs
npm audit --audit-level=moderate
npm run build
npm run test:http
```

`test-postgres.mjs` richiede PostgreSQL locale e i comandi `createdb`/`dropdb`. Crea un database `ftp_test_<casuale>`, applica la migrazione, esegue la suite e lo rimuove. Non usa né resetta database applicativi esistenti. I test bloccano l'esecuzione distruttiva se il nome non segue questo prefisso. Il controllo HTTP avvia un server isolato sulla porta 3101 con archivio temporaneo, account e segreto dedicati; esegue smoke test ed E2E delle API, poi chiude il server e rimuove i dati. Non invia messaggi ai provider. La porta 3101 deve essere libera.

La build usa Webpack: Turbopack nel workspace incontrava collegamenti simbolici della vecchia directory temporanea per documenti. Non è stato necessario rimuovere quei file dell'utente.

## Utenti e sicurezza

`STAFF_USERS` contiene un array JSON di `{email, role, passwordHash}`. Ruoli operativi attivi: `admin` e `operator`. L'operatore gestisce prenotazioni e comunicazioni; solo admin modifica catalogo, contenuti, regole, partner, liquidazioni e foto. Non assegnare `guide`: l'accesso staff per quel ruolo non è abilitato; le guide si possono tracciare come affiliate.

Creare l'hash con `scripts/password-hash.mjs`, fornendo la password tramite stdin, non come argomento di shell. Il risultato è `salt:hash` scrypt. Conservare il JSON nel secret manager del provider, mai nel repository. Configurare `SESSION_SECRET` casuale di almeno 32 caratteri. La sessione dura 8 ore, è firmata HMAC ed è conservata in cookie HttpOnly, Secure in produzione, SameSite=Lax. Rimuovere un utente dalla configurazione invalida anche la sua sessione al controllo successivo; cambiare SESSION_SECRET invalida tutte le sessioni.

Le autorizzazioni sono ripetute nelle API, indipendentemente dalla pagina. Le mutazioni controllano l'origine. I corpi JSON sono limitati a 200 KB durante la lettura. Sono presenti limiti per login, checkout, recupero e accesso cliente, conservati nel database per condividere lo stato tra istanze. Il proxy di hosting deve sovrascrivere gli header IP utilizzati: non esporre direttamente un server che si fida di `x-forwarded-for` controllabile dal client. Il livello applicativo non sostituisce la protezione DDoS del provider.

Non esiste un’area cliente. Sito, carrello e checkout sono accessibili senza autenticazione. Il carrello usa `localStorage`, distinto per browser/profilo/dispositivo e origine; svuotare i dati del sito elimina il carrello. La ricevuta finale usa una prova casuale di 256 bit custodita in `sessionStorage`, non inviata via email né inserita in URL di accesso. `POST /api/platform/confirmation` restituisce esclusivamente il riepilogo del checkout in sola lettura, valido per 24 ore; non espone contatti, note, password o azioni di gestione. Il download ICS conserva il proprio controllo di autorizzazione. `/account` e `/self-service/*` rispondono 404; `/api/platform/customer/*` e `/api/platform/lookup` rispondono 410. Il link email `/gestisci-prenotazione/[pnr]/[proof]` autorizza soltanto quella prenotazione: `POST /api/platform/manage/[pnr]` verifica una prova HMAC per lettura, cambio partenza, cancellazione e consenso. Il segreto è `BOOKING_LINK_SECRET` o `SESSION_SECRET`; cambiarlo invalida i link precedenti. Non esiste un portale personale.

Regole configurabili: `/admin/impostazioni` gestisce percentuale e soglia dello sconto multi-tour, ore di cancellazione gratuita e percentuale di rimborso tardivo. `/admin/tour` gestisce età minima adulti, età minima bambini e prezzi per le tre fasce. Le fasce visualizzate vengono calcolate dalle soglie salvate, senza intervalli fissati nel frontend.

Header: CSP, nosniff, divieto framing, Permissions Policy, HSTS e referrer policy. La CSP permette inline script necessari al runtime Next e al tag: non è una CSP con nonce per richiesta. Nessuna esecuzione HTML dei testi CMS. Il codice widget TripAdvisor è una configurazione amministrativa fidata, non input cliente. Il caricamento foto accetta solo JPEG/PNG/WebP fino a 5 MB, limita i pixel e riconverte in WebP per rimuovere metadata e contenuti non immagine.

## Infrastruttura e deploy

1. Creare repository GitHub privato e caricare il progetto con il lockfile. Preservare le modifiche preesistenti. Nessun push/commit viene effettuato automaticamente da questa consegna.
2. DigitalOcean: creare PostgreSQL gestito in regione UE. Usare TLS e un utente applicativo dedicato. Copiare la connection string in `DATABASE_URL`; regolare il pool per la concorrenza Vercel (`connection_limit=5` è un punto iniziale, non un dimensionamento garantito).
3. Eseguire `npm ci` e `npm run db:migrate` verso il database scelto. Per un DB vuoto la migrazione inclusa è completa. Per un DB già esistente fare prima backup, confronto schema e baseline: non lanciare reset o migrazioni distruttive.
4. Vercel: importare repository; framework Next; Node 22; install `npm ci`; build `npm run build`. Configurare variabili `.env.example`. `PLATFORM_STORAGE=postgres`, mai `local`. Nessun file `.env` va caricato. Il build non richiede un DB raggiungibile per prerenderizzare le pagine dinamiche, ma l'esecuzione sì.
5. Impostare dominio e `NEXT_PUBLIC_SITE_URL` esatto, senza percorso. Configurare DNS secondo Vercel e attendere certificato HTTPS. Le immagini e il sito nei metadata richiedono i valori definitivi prima del build.
6. Render: usare `render.yaml`. Il worker richiede solo `PLATFORM_URL` e lo stesso `CRON_SECRET` dell'app. Esegue invii ogni minuto, casella ogni 5 minuti e manutenzione dati ogni 24 ore. La coda ha lease di 5 minuti per il recupero dopo un crash. Non attivare un secondo scheduler non coordinato senza comprenderne il volume.
7. Configurare Stripe/SMTP/Twilio/IMAP. Provare in staging. Verificare `/api/platform/health`, login, ordine cash, pagamento e rimborso test, email e ICS, concorrenza, import e reminder.
8. Collegare Search Console, sitemap e Ads. Inviare la sitemap dopo avere validato contenuti e robots.

`Dockerfile` offre un'alternativa standalone per un server Render/DigitalOcean, con utente senza privilegi. `.dockerignore` e output tracing escludono file personali, env, backup, documenti e dati locali. Lo script `sanitize-build.mjs` rimuove inoltre i file env che Next copia esplicitamente nello standalone, senza toccare quelli sorgente. Il container web non include le credenziali al build. Usare reverse proxy HTTPS se non si ospita su Vercel.

## Stripe e rimborsi

Webhook: `/api/stripe/webhook`. Abilitare:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`
- `refund.created`, `refund.updated`, `refund.failed`

Usare chiavi e signing secret di test in staging, quindi sostituire con live senza mescolare sessioni e webhook. Il server verifica sessione, ID ordine, EUR e importo atteso. La deduplica evento e il cambio di stato sono nello stesso commit. Stripe usa chiavi idempotenti per creazione Checkout e rimborsi. La pagina di ritorno non può marcare un ordine pagato.

Il rimborso non è segnato completato prima della risposta/evento del provider. Un rimborso fallito richiede verifica dal gestionale e su Stripe; non promettere al cliente che un job in coda equivale a denaro restituito. Per import OTA il pagamento è esterno e il rimborso va eseguito nel portale del provider; il sistema invia una richiesta operativa al team, senza fingere un rimborso Stripe.

## Email, WhatsApp e retry

SMTP professionale con STARTTLS o TLS 465, dominio verificato e SPF/DKIM/DMARC. Il worker consuma l'outbox. Senza SMTP l'invio resta in errore/ritento: non viene segnato inviato e non vengono stampati dati cliente nei log. Ogni modifica/cancellazione crea una nuova comunicazione. Il formato testo contiene mappa, riepilogo, riferimenti per contattare lo staff e calendario.

Twilio richiede account, auth token, mittente WhatsApp e `TWILIO_CONTENT_SID` approvato. Il template deve contenere cinque variabili: nome, titolo tour, data/ora Prague, indirizzo incontro, PNR. Il consenso è registrato con data e versione delle condizioni. I reminder pendenti vengono invalidati su modifica/cancellazione. L'invio parte circa all'ora configurata, secondo la frequenza del worker.

Gli invii SMTP/Twilio hanno semantica almeno una volta: dopo una risposta di rete incerta un retry può duplicare un messaggio. Il Message-ID email è stabile, ma non equivale a una garanzia di deduplica da parte del provider. La coda conserva tentativi, errore e stato. Dopo cinque errori passa a failed e può essere ritentata dallo staff. I rimborsi hanno invece idempotency key Stripe.

## OTA

Casella IMAP dedicata con TLS, mittenti esatti in `OTA_ALLOWED_SENDERS` e risultati DKIM verificati dal server di posta fidato. `authentication-results` deve provenire dall'infrastruttura ricevente che filtra gli header inseriti dal mittente. Configurare e verificare questo comportamento presso il provider email prima di abilitare import automatici.

Il parser riconosce campi strutturati `CUSTOMER`, `EMAIL`, `PHONE`, `TOUR_SLUG`, `SLOT_ID`, `ADULTS`, `CHILDREN`, `INFANTS`. Supporta anche etichette comuni italiane, inglesi e spagnole con titolo/alias attività, data ISO o europea e orario. I titoli/ID attività esterni si associano dal campo alias del tour. Una corrispondenza ambigua o incompleta passa in revisione: lo staff completa il modulo e importa con gli stessi controlli inventario. Il riferimento provider è usato per deduplicare; se assente si usa il message ID. `TOTAL_EUR` viene usato solo se numerico esplicito; `PAYMENT_STATUS: paid` marca il pagamento esterno. Non si deducono incassi dal solo invio di una conferma.

Endpoint alternativo per un gateway autorizzato: `POST /api/platform/ota/inbound`, Bearer `OTA_WEBHOOK_SECRET`, JSON `{provider, reference, raw}`. Il gateway deve essere fidato; il token autorizza l'import. Il motore non esegue istruzioni contenute nell'email.

Lettura email non è sincronizzazione bidirezionale con il calendario del portale. Il sistema non può impedire a un portale esterno di accettare prima una vendita sulla propria disponibilità: un import senza posti rimane da riconciliare. Comunicazioni con contenuto diverso per un riferimento già importato vengono mantenute in revisione con un link alla prenotazione esistente: lo staff la aggiorna e chiude la revisione, senza creare una seconda prenotazione. Con campioni reali si possono estendere i parser e i test senza cambiare inventario e UI.

## Immagini e backup

Le foto pubbliche usano un bucket Spaces dedicato con credenziali limitate. Configurare `MEDIA_BUCKET`, `MEDIA_PUBLIC_BASE`, `MEDIA_ACCESS_KEY_ID`, `MEDIA_SECRET_ACCESS_KEY` e `SPACES_ENDPOINT`. La base pubblica deve essere configurata anche al build Next per autorizzare il dominio immagini. Il bucket di backup è separato e privato. In sviluppo le foto sono in `.data/media`, servite dal solo endpoint immagini con chiavi UUID.

Il cron backup è previsto alle **02:15 UTC** ogni giorno. `scripts/backup.py` usa pg_dump, cifra con chiave pubblica age e carica su Spaces con ACL privata. Conservare la chiave privata di ripristino fuori dai servizi. Non assegnare al worker di backup l'accesso di scrittura al bucket media e non rendere pubblico il bucket backup. Configurare lifecycle, per esempio 30 copie giornaliere e un archivio mensile secondo le necessità concordate. Abilitare anche i backup gestiti del database e alert del cron.

Ripristino da provare su un DB temporaneo, mai prima sulla produzione:

```bash
aws s3 cp s3://BUCKET/PERCORSO.dump.age ./backup.dump.age --endpoint-url https://REGIONE.digitaloceanspaces.com
age -d -i /percorso/chiave-privata.txt -o ./backup.dump ./backup.dump.age
# Fornire la connessione tramite variabili PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD.
pg_restore --no-owner --no-acl --dbname=DB_DI_PROVA ./backup.dump
```

Verificare conteggi, prenotazioni, inventario e login sull'ambiente restaurato. Dopo un restore, sospendere gli invii fino ad avere riconciliato la coda e i pagamenti con i provider: una copia storica può contenere job già eseguiti. Non è stato eseguito un upload o un restore Spaces reale senza credenziali.

## Privacy, contenuti e operatività

La manutenzione rimuove i dati personali operativi secondo i giorni configurati, lasciando importi e contatori pseudonimizzati. La policy non sostituisce gli obblighi contabili e legali del titolare. Il titolare deve approvare informativa, condizioni, retention, fornitori, trasferimenti e contatti prima della pubblicazione. Per richieste di esercizio diritti verificare l'identità e applicare le modifiche anche a SMTP/OTA/Twilio/backup dove necessario; la cancellazione applicativa non elimina automaticamente archivi esterni.

Il CMS pubblica testo e metadata, senza HTML arbitrario. I form restano presenti nelle pagine contatti/partner anche quando i testi sono personalizzati. Il catalogo, la sitemap e gli endpoint GEO usano gli stessi tour pubblicati. Il consenso marketing è revocabile dal pulsante preferenze. Maps e TripAdvisor richiedono caricamento esplicito.

### Operazioni quotidiane

1. Controllare partenze e assegnazione guida.
2. Controllare prenotazioni e pagamenti in attesa.
3. Risolvere email OTA in revisione e comunicazioni failed.
4. Registrare presenza/no-show e incassi cash.
5. Controllare commissioni maturate e registrare le liquidazioni effettive.
6. Verificare backup giornaliero e disponibilità dei servizi.

### Collaudi prima del lancio

Nessuna credenziale esterna è stata creata o usata da questa consegna. Restano da eseguire sui servizi reali: pagamento/rimborso Stripe test e live controllato, recapito SMTP, template Twilio, campioni OTA, restore backup, dominio/TLS e verifica visuale desktop/mobile. Il codice e le configurazioni sono consegnati; la messa online e la certificazione delle integrazioni richiedono tali accessi.

Riferimenti tecnici consultati: [Prisma transactions](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions), [Next authentication](https://nextjs.org/docs/app/guides/authentication), [Render Blueprint](https://render.com/docs/blueprint-spec), [Twilio WhatsApp templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates), [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment).

## CMS e distribuzione

`/admin/sito` gestisce home, FAQ, foto, menu, contatti, social e footer; solo admin può pubblicare. I font Manrope e Fraunces sono locali, con licenze in `public/licenses`, senza download Google in fase di build. La build prepara un bundle standalone completo di statici e public, rimuovendo i file ambiente copiati da Next. `npm start` avvia tale bundle. `test:http:production` crea e rimuove esclusivamente un database temporaneo locale e collauda il bundle compilato.
