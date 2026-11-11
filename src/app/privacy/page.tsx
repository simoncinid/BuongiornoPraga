import { publicSiteContent } from "@/lib/platform/public";
import { readState } from "@/lib/platform/store";
import { publicPage } from "@/lib/platform/public";
import { ContentBlock } from "@/components/ContentBlock";
export const dynamic = "force-dynamic";
const baseMetadata = {
  title: "Privacy e cookie",
  alternates: { canonical: "/privacy" },
};
export default async function Page() {
  const { globals: site } = await publicSiteContent();
  const content = await publicPage("privacy");
  if (content) return <ContentBlock page={content} />;
  const { settings } = await readState();
  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <h1 className="display-xl mb-7">Privacy e cookie</h1>
        <div className="card grid gap-6 p-7">
          <p>
            Titolare: Domenico Masini, ditta individuale, IČO 21191310, Kaprova
            42/14, 11000 Praha – Staré Město, Repubblica Ceca. Contatto per la
            gestione dei dati:{" "}
            <a className="underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            .
          </p>
          <h2 className="display-md">Dati e finalità</h2>
          <p>
            Nome, email, telefono, partecipanti, prenotazioni e note necessarie
            servono a organizzare il tour, inviare conferme, gestire pagamenti e
            fornire assistenza. Il trattamento operativo è collegato alla
            richiesta e all’esecuzione del servizio. I log di sicurezza sono
            utilizzati per proteggere il sistema e prevenire abusi. Evita di
            inserire dati sanitari o altre informazioni sensibili nelle note.
          </p>
          <h2 className="display-md">Servizi esterni</h2>
          <p>
            I pagamenti sono elaborati da Stripe: il sito non conserva i dati
            delle carte. Hosting, database e invio email utilizzano fornitori
            tecnici incaricati per le rispettive attività. Se scegli il
            promemoria WhatsApp, il numero e i dati essenziali del tour sono
            trattati tramite Twilio e WhatsApp. Maps e TripAdvisor vengono
            caricati solo dopo una tua richiesta esplicita al relativo contenuto
            esterno. I rispettivi fornitori possono trattare dati secondo le
            loro informative.
          </p>
          <h2 className="display-md">Consenso e pubblicità</h2>
          <p>
            I reminder WhatsApp sono facoltativi. Il tracciamento Google Ads
            viene caricato solo se accetti i cookie marketing. Puoi cambiare
            scelta dal pulsante “Preferenze cookie”. Il sito conserva localmente
            il carrello e l’eventuale codice partner; la sessione dello staff
            usa un cookie di sicurezza HttpOnly. Non utilizziamo dati di
            prenotazione per inviare newsletter automatiche.
          </p>
          <h2 className="display-md">Conservazione e diritti</h2>
          <p>
            La configurazione iniziale prevede la rimozione dei dati personali
            operativi dopo {settings.retentionDays} giorni dal tour, salvo
            obblighi o necessità di conservazione che il titolare dovrà
            definire. Le email OTA originali sono ripulite dopo 30 giorni, le
            richieste dopo 180 giorni. Puoi contattare il titolare per accesso,
            rettifica, cancellazione, limitazione, opposizione, portabilità o
            revoca del consenso, ove applicabili. Puoi presentare reclamo
            all’autorità di controllo competente.
          </p>
          <p className="text-sm">Informativa aggiornata al 6 novembre 2026.</p>
        </div>
      </div>
    </section>
  );
}

export async function generateMetadata() {
  const p = await publicPage("privacy");
  return {
    ...baseMetadata,
    ...(p?.seoTitle ? { title: p.seoTitle } : {}),
    ...(p?.seoDescription ? { description: p.seoDescription } : {}),
  };
}
