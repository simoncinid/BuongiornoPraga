import Link from "next/link";
import { readState } from "@/lib/platform/store";
import { publicPage } from "@/lib/platform/public";
import { ContentBlock } from "@/components/ContentBlock";
export const dynamic = "force-dynamic";
const baseMetadata = {
  title: "Termini e cancellazioni",
  alternates: { canonical: "/termini" },
};
export default async function Page() {
  const content = await publicPage("termini");
  if (content) return <ContentBlock page={content} />;
  const { settings: s } = await readState();
  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <h1 className="display-xl mb-7">Termini di prenotazione</h1>
        <div className="card grid gap-6 p-7">
          <p>
            Il servizio è organizzato da Domenico Masini, ditta individuale, IČO
            21191310, Kaprova 42/14, 11000 Praha – Staré Město, Repubblica Ceca.
            Le informazioni del tour specificano durata, lingua, punto
            d’incontro, tariffe e servizi inclusi.
          </p>
          <h2 className="display-md">Prenotazione e pagamento</h2>
          <p>
            I prezzi sono in euro e il riepilogo mostra il totale prima della
            conferma. Puoi scegliere contanti sul posto o pagamento online
            tramite Stripe. Le prenotazioni online in attesa di pagamento
            riservano i posti per circa 30 minuti. La conferma effettiva del
            pagamento dipende dalla verifica di Stripe.
          </p>
          <h2 className="display-md">Sconti e partecipanti</h2>
          <p>
            Con almeno {s.minimumTours} tour diversi nel carrello si applica
            automaticamente uno sconto del {s.multiTourPercent}%. Le fasce d’età
            e le tariffe sono indicate nel tour. Anche gli infanti occupano un
            posto nella capienza del gruppo.
          </p>
          <h2 className="display-md">Modifiche e cancellazioni</h2>
          <p>
            Puoi modificare o cancellare la singola prenotazione dal link
            ricevuto via email, senza account, oppure contattare lo staff.
            Le modifiche della partenza dipendono dai
            posti disponibili. La cancellazione fino a {s.cancellationHours} ore
            prima dà diritto al rimborso integrale dei pagamenti registrati;
            dopo questo termine il rimborso previsto è del {s.lateRefundPercent}
            %.
          </p>
          <p>
            I rimborsi sono effettuati sul metodo di pagamento originale e
            seguono i tempi del circuito di pagamento. Se un tour viene
            annullato dall’organizzatore, lo staff contatta il cliente per
            concordare una soluzione o gestire il rimborso.
          </p>
          <h2 className="display-md">Comunicazioni e assistenza</h2>
          <p>
            Conserva la conferma email e il codice prenotazione. Presentati al
            punto d’incontro con anticipo. I reminder WhatsApp sono facoltativi
            e richiedono il consenso. Per esigenze particolari o richieste non
            gestibili online usa la pagina{" "}
            <Link href="/contatti" className="underline">
              contatti
            </Link>
            .
          </p>
          <p className="text-sm">Condizioni aggiornate al 6 novembre 2026.</p>
        </div>
      </div>
    </section>
  );
}

export async function generateMetadata() {
  const p = await publicPage("termini");
  return {
    ...baseMetadata,
    ...(p?.seoTitle ? { title: p.seoTitle } : {}),
    ...(p?.seoDescription ? { description: p.seoDescription } : {}),
  };
}
