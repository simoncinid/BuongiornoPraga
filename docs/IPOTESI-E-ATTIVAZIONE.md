# Ipotesi adottate e attivazione

## Perimetro aggiornato secondo la precisazione del cliente

Le prime tre regole commerciali sono configurabili dal gestionale: sconto e cancellazione in `/admin/impostazioni`, fasce e prezzi in `/admin/tour`. I valori sotto sono solo iniziali. Il committente ha confermato la gestione autonoma della singola prenotazione tramite link email protetto, senza account cliente.

## Decisioni e valori iniziali

1. Si implementano entrambe le fasi del contratto del 6 luglio 2026, superando le precedenti note del repository limitate alle interfacce della fase 1.
2. Marchio mantenuto: **FreeTourPraga**, come nel progetto esistente. La cartella si chiama ancora BuongiornoPraga. Nessun rebranding automatico.
3. Conservati tour, immagini e contatti già nel repository. Sono dati iniziali da confermare, non nuovi contenuti certificati. Le valutazioni e le recensioni esemplificative non sono usate come prova sociale o markup SEO verificato.
4. Valuta EUR. Fuso operativo Europe/Prague; le date nel database sono UTC. Prezzi per persona; anche gli infanti occupano un posto.
5. Fasce iniziali: infanti sotto 4 anni, bambini da 4 a 11, adulti da 12. Fasce e prezzi modificabili per tour. Un adulto responsabile è obbligatorio.
6. Sconto automatico del 10% da due tour diversi. La ripetizione dello stesso tour non vale come secondo tour. Nessun codice promozionale fittizio; il codice partner attribuisce la vendita e non concede automaticamente uno sconto ulteriore.
7. Conferma immediata per contanti. I posti di un ordine Stripe sono bloccati per circa 30 minuti. Il webhook, non il ritorno del browser, conferma l'incasso. I pagamenti ricevuti dopo il rilascio vengono indirizzati a rimborso, senza ricreare posti venduti.
8. Modifiche gratuite su partenze dello stesso tour a parità di partecipanti fino a 24 ore prima. Cancellazione con rimborso integrale fino a 24 ore prima; dopo, rimborso iniziale dello 0%. Le soglie e la percentuale sono configurabili da `/admin/impostazioni`; le operazioni sono disponibili tramite il link della prenotazione o tramite staff. Le cancellazioni cash non generano addebiti automatici di penali.
9. Nessun account o area cliente, nessun recupero PNR + email e nessun link per entrare in una sezione personale. Sito, carrello e checkout sono pubblici. Il carrello vive nel localStorage del browser; la ricevuta del checkout nella sessionStorage della scheda. La conferma email include il link protetto della singola prenotazione, riepilogo, pagamento e calendario. Non esiste un profilo cliente.
10. Commissione definita per affiliato, sul prezzo dopo lo sconto. L'importo viene congelato alla prenotazione, azzerato alla cancellazione e considerato maturato dopo la presenza registrata. La liquidazione è una registrazione contabile, non un trasferimento bancario.
11. Attribuzione all'ultimo codice partner valido, conservato nel browser fino a sostituzione/rimozione. Un cliente può modificarlo al checkout. Non è un sistema antifrode per affiliazioni avversarie.
12. Reminder WhatsApp a 24 ore, solo con consenso. Conferme operative sempre via email. Nessuna promessa di assistenza umana H24: mantenuto l'orario 9–19 già presente nel progetto.
13. Le email OTA ambigue non assegnano posti prima della revisione. Le tariffe di catalogo sono il fallback se manca `TOTAL_EUR`; lo staff deve verificare gli importi OTA. Il pagamento è esterno ed è marcato pagato solo con un campo esplicito o una verifica staff. I rimborsi OTA richiedono esecuzione sul portale del provider.
14. Dati operativi personali rimossi dopo 730 giorni; messaggi OTA originali dopo 30 giorni; richieste dopo 180 giorni. Il titolare deve confermare eventuali obblighi di conservazione prima del lancio.
15. Vercel ospita web e API Node; Render esegue il worker e il backup giornaliero; DigitalOcean fornisce PostgreSQL e Spaces. Il backend Next Route Handlers è l'equivalente Node/TypeScript consentito dal contratto; non è necessario un secondo server NestJS.

## Per vedere il lavoro

```bash
npm ci
npm run setup:local
npm run dev
```

- Sito: http://localhost:3100
- Staff: http://localhost:3100/accesso
- Email locale: `admin@freetourpraga.local`
- Password **solo sviluppo**: `PragaLocale!2026`

Lo script crea `.env.development.local` con un segreto casuale e hash scrypt della password. I dati persistono in `.data/platform.json`; nessun database è necessario per l'anteprima. Il file locale non è adatto a più processi o alla produzione. La modalità locale è rifiutata con `NODE_ENV=production`.

## Necessario per il lancio reale

- Repository e progetto Vercel; progetto Render; database PostgreSQL e bucket Spaces; dominio.
- Utenti staff reali, password uniche lunghe, `SESSION_SECRET` e credenziali servizio casuali.
- Stripe in modalità test e poi live; webhook degli eventi elencati nel manuale.
- SMTP, SPF/DKIM/DMARC e contatto email definitivo.
- Twilio WhatsApp, template approvato e canale di consenso.
- Casella OTA dedicata e campioni reali Civitatis/GetYourGuide, incluse modifiche e cancellazioni.
- Account Google Ads, ID conversione e conferma budget.
- Dati legali, condizioni, prezzi, fasce, testi, foto e contatti approvati.
- Prova completa su smartphone e desktop, pagamento/rimborso test, email, reminder, import OTA e restore del backup.

Non occorre riscrivere il codice per inserire questi accessi. Si configurano le variabili indicate e si eseguono migrazioni, provisioning e collaudi descritti nel manuale. Account, autorizzazioni dei provider e verifiche esterne non vengono sostituiti da conferme simulate.
