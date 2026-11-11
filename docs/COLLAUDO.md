# Verifiche eseguite — 6 novembre 2026

## Risultati

- TypeScript: nessun errore.
- Build Next.js di produzione: riuscita con Webpack, route server e pagine statiche generate.
- File `.env` rimossi automaticamente dal bundle standalone generato; file sorgente conservati.
- Audit npm: zero vulnerabilità segnalate, incluse dipendenze di sviluppo, al momento della verifica.
- 24 test applicativi: superati sullo store locale; le prime 20 verifiche erano già state eseguite anche su PostgreSQL temporaneo. Il collaudo HTTP di produzione è superato sul bundle standalone con PostgreSQL temporaneo, poi rimosso.
- Smoke HTTP: 18 pagine/endpoint pubblici rispondono 200; login staff, isolamento dati, API protette, cron, calendario privato e rifiuto origine esterna verificati.
- E2E HTTP su server isolato: affiliate/QR, ricalcolo sconto, ordine multi-tour, retry idempotente, ricevuta senza account, ICS, isolamento dei link per singola prenotazione, cambio partenza e cancellazione dallo staff con posti liberati, correzioni partecipanti/contatti, presenza/incasso, liquidazione commissioni, CMS con metadata e form conservato, CSV. Upload e recupero immagine WebP verificati in sviluppo; upload Spaces escluso dal collaudo di produzione senza credenziali.
- Sintassi script backup Python e configurazioni JSON: valida.
- Controllo whitespace Git: nessun errore nelle modifiche.

## Invarianti testate

1. Partecipanti negativi/frazionari e mancato consenso termini sono rifiutati.
2. Lo sconto multi-tour è calcolato dal server.
3. Dodici richieste concorrenti su cinque posti producono esattamente cinque prenotazioni.
4. La stessa idempotency key non crea una seconda prenotazione; un payload differente viene rifiutato.
5. Le cancellazioni autorizzate dallo staff o dal link della singola prenotazione liberano i posti una sola volta.
6. Una modifica verso una partenza piena non rilascia i posti originali.
7. Un'email OTA duplicata non duplica la prenotazione; un formato sconosciuto resta in revisione.
8. Commissioni attribuite dal server e azzerate alla cancellazione.
9. I blocchi non pagati scaduti rilasciano i posti.
10. Gli URL immagine non autorizzati vengono rifiutati.
11. I campi OTA etichettati sono associati ad alias, date e orari Prague.
12. Firma, importo e duplicati Stripe vengono controllati prima di confermare un pagamento.
13. Il rimborso è accodato secondo policy e non dichiarato completato in anticipo.
14. Conversione ora locale/UTC corretta in inverno ed estate; orario inesistente al cambio DST rifiutato.
15. Provider mancanti producono retry, senza invii simulati dichiarati riusciti.
16. La manutenzione rimuove dati personali, token e testo delle comunicazioni scadute.
17. Un messaggio successivo per una prenotazione OTA esistente passa in revisione senza crearne una seconda.
18. DKIM pass deve corrispondere al dominio mittente autorizzato.

19. Sconto e policy vengono letti dalla configurazione persistente; la policy concordata resta memorizzata sulla prenotazione.
20. Il carrello persiste nel localStorage dello stesso browser e resta isolato da un browser diverso.

Il collaudo HTTP verifica anche il salvataggio di sconto/cancellazione/fasce tramite le API amministrative e il successivo utilizzo nei dati pubblici e nel calcolo del prezzo.

## Verifiche ancora necessarie

Non sono stati effettuati un test visivo completo nel browser, una misura Lighthouse o una certificazione WCAG. Il browser risultava occupato da un'altra interazione; nessuno screenshot è presentato come prova di questa versione.

Non sono stati collaudati account reali Stripe/SMTP/Twilio/IMAP/Ads/Spaces, né sono stati effettuati addebiti, invii, upload su cloud, campagne o deploy pubblici. Il backup è implementato e schedulato nella configurazione, ma va verificato con un restore reale dopo il provisioning.

Il collaudo HTTP verifica le API e il rendering server; non sostituisce un test delle interazioni JavaScript nel browser né un test su dispositivi mobili reali. Le pagine includono layout e controlli responsive; la qualità visiva finale deve essere confermata in quella verifica.

21. La prova della prenotazione non autorizza operazioni su altre prenotazioni.
22. Il cambio partenza cliente rispetta la scadenza prevista.
23. Il CMS globale rifiuta URL non sicuri.
24. Il rimborso cash richiede registrazione manuale e non avvia Stripe.
