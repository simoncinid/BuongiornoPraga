# Piano di configurazione Google Ads

La piattaforma implementa il tag e l'evento conversione. Senza account collegato non sono state create o pubblicate campagne, spesi budget o verificati dati Ads.

## Configurazione tecnica

1. Nell'account Ads creare un'azione conversione **Acquisto**, origine sito web, EUR, valore dinamico e conteggio per transazione.
2. Copiare ID `AW-...` e conversion label in `/admin/impostazioni`.
3. Il consenso marketing abilita il tag. I dati cliente (nome, email, telefono) non vengono inviati nel payload di conversione.
4. La conferma del checkout, nella stessa scheda del browser, invia valore e ID ordine quando tutte le voci risultano confermate. Il transaction_id stabile consente la deduplica da parte di Google. Contanti significa prenotazione confermata, non denaro già incassato: confrontare il KPI incassato separatamente.
5. Testare prima con Tag Assistant e verificare l'azione conversione nel relativo account. In presenza di ad blocker o mancato ritorno alla conferma del checkout, una conversione browser può non arrivare: i KPI gestionali rimangono la fonte delle prenotazioni.

## Campagna iniziale pronta da configurare

- Ricerca, lingua italiana, rete di ricerca; disattivare inizialmente l'espansione Display.
- Target: Italia per pianificazione viaggio e Praga per utenti già sul posto, in campagne separate per misurare il rendimento.
- Budget di lavoro da approvare: circa 400 EUR/mese, ripartizione iniziale 70% Italia e 30% Praga. Il budget giornaliero e i limiti effettivi vanno configurati nell'account.
- Gruppi: Tour Praga italiano; Castello in italiano; Tour privati; Brand.
- Landing page specifica del tour; il checkout è pubblico e non esiste un’area cliente.
- Esempi keyword a frase/esatta: “tour praga italiano”, “visita guidata praga in italiano”, “tour castello praga italiano”, “guida privata praga italiano”, “freetourpraga”.
- Negative iniziali da verificare: lavoro, stipendio, corso, pdf, traduttore, virtuale. Non escludere “gratis” automaticamente: il marchio può generare aspettative di free tour, da chiarire nel messaggio e nella pagina prezzi.
- Titoli: Tour di Praga in Italiano; Scopri Praga con una Guida; Prenota il Tuo Tour a Praga; Visite in Piccoli Gruppi; Castello di Praga in Italiano.
- Descrizioni: “Scegli data e orario. Tour in italiano, punto d’incontro chiaro e conferma via email.” / “Prenota online e scegli come pagare. Ricevi riepilogo e dettagli via email.”
- Asset: sitelink catalogo, Castello, tour privati e contatti; callout guida in italiano, piccoli gruppi, conferma email, Maps.
- Parametri: `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}`. L'integrazione misura le conversioni Ads tramite tag; l'attribuzione UTM dettagliata non è un sostituto dell'account Ads e non è inclusa nei KPI per canale operativi.

## Controllo mensile

Verificare spesa, costo per prenotazione, termini ricerca, tour venduti, conversioni, cancellazioni e no-show. Confrontare conversioni browser con ordini gestionali e pagamenti effettivi. Le attività di gestione mensile previste dal contratto sono un servizio operativo continuativo, non una funzione che il codice può eseguire senza account e supervisione.

Riferimenti: [gestione cron Vercel](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Blueprint Render](https://render.com/docs/blueprint-spec), [template WhatsApp Twilio](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates).
