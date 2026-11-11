> Documento storico, superato il 6 novembre 2026. Per il sistema attuale leggere [Manuale tecnico](MANUALE-TECNICO.md), [copertura contratto](REQUISITI-CONTRATTO.md) e [ipotesi](IPOTESI-E-ATTIVAZIONE.md).

# Frontend Fase 1 — FreeTourPraga

Riferimento: preventivo `preventivo-freetourpraga-diegoSimoncini.pdf`, 28 ottobre 2026, pagine 1–4. Branch: `modifiche-per-freetourpraga`.

Le schermate sono direttamente nelle route del progetto. Titoli e marchio usano Fraunces, testi e comandi Manrope. I dati amministrativi sono dimostrativi. Non sono richiesti servizi API per percorrere il frontend.

## Sito pubblico

| Route | Schermata |
| --- | --- |
| `/` | Homepage, tour, fiducia, galleria, FAQ, TripAdvisor |
| `/tour` | Catalogo e filtri |
| `/tour/citta-vecchia-ponte-carlo` | Dettaglio, mappa, calendario, orari, partecipanti |
| `/tour/castello-praga-mala-strana` | Seconda scheda tour |
| `/tour/birra-ceca-storie-locali` | Terza scheda tour |
| `/tour-privati` | Presentazione tour privati |
| `/partner-europa` | Presentazione e modulo richiesta |
| `/` (sezione FAQ) | Domande frequenti |
| `/contatti` | Contatti e modulo |
| `/carrello` | Esperienze scelte, rimozione, codice sconto |
| `/checkout` | Contatti viaggiatore e riepilogo di tutti i tour |
| `/prenotazione/confermata` | Conferma dimostrativa, riepilogo e mappe |
| `/privacy`, `/termini` | Pagine informative |

Per il carrello pieno: scheda tour → data → orario → partecipanti → aggiungi al carrello. Codice dimostrativo: `PRAGA10`. Lo sconto resta applicato passando al checkout. La conferma usa sessionStorage e svuota il carrello; nessuna email viene inviata.

## Back-office contenuti (step 3)

- `/admin/contenuti`: elenco pagine, ricerca.
- `/admin/contenuti/homepage`: editor titoli, sottotitoli, testi, immagini, SEO e pubblicazione.
- Editor delle altre pagine collegati dall’elenco, inclusi scheda tour, FAQ, contatti e footer con link social/TripAdvisor.
- L’editor riguarda il frontend; date, prezzi e prenotazioni sono nelle sezioni operative.

## Backend minimal — interfacce (step 4–5)

| Route | Schermata |
| --- | --- |
| `/admin` | Panoramica e partenze |
| `/admin/tour` | Elenco tour |
| `/admin/tour/nuovo` | Creazione tour e partenze |
| `/admin/tour/citta-vecchia-ponte-carlo` | Modifica tour, punto d’incontro e orari |
| `/admin/calendario` | Calendario mensile navigabile |
| `/admin/prenotazioni` | Ricerca ed elenco |
| `/admin/prenotazioni/FTP-1042` | Dettaglio, viaggiatore, note, comunicazioni |
| `/admin/prezzi` | Tariffe per tour e fasce d’età |
| `/admin/sconti` | Codici e sconto carrello |
| `/admin/sconti/nuovo` | Regole, soglie e validità |
| `/admin/last-minute` | Abilitazione e limiti prima della partenza |
| `/admin/affiliati` | Partner e attribuzione |
| `/admin/affiliati/nuovo` | Contatti, codice e sconto partner |
| `/admin/email` | Testi conferma, destinatari operativi, anteprima cliente e parsing |

I pulsanti di salvataggio mostrano feedback dimostrativo, senza persistenza server. Il caricamento immagine mostra l’anteprima locale. Form, calendario, filtri, carrello e selezioni sono interattivi.

## Esclusioni rispettate nel frontend

Nessuna area cliente, modifica/cancellazione self-service, inventario centralizzato, canali esterni, pagamento online, reminder o gestione campagne. Le vecchie route `/account`, `/self-service/*`, `/faq` (FAQ presenti nella homepage) e `/admin/pre-tour` restituiscono 404; `/pagamento` porta al checkout senza pagamenti. I vecchi moduli backend non sono stati integrati nel nuovo flusso né riscritti in questa attività di frontend.

La fase 2 non ha pagine dedicate: sostituirà il backend minimal via API, mantenendo le interfacce e il back-office contenuti.
