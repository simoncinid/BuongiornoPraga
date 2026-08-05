export const metadata = {
  title: "Termini e cancellazioni",
  alternates: {
    canonical: "/termini"
  }
};

export default function TermsPage() {
  return (
    <section className="section">
      <div className="container-page max-w-3xl">
        <h1 className="display-xl mb-4">Termini e cancellazioni</h1>
        <div className="card grid gap-4 p-6">
          <p className="body-md">
            La prenotazione viene confermata via email con riepilogo del tour, data, orario, partecipanti e punto d'incontro. Puoi scegliere il pagamento online oppure, quando disponibile, il pagamento in contanti sul posto.
          </p>
          <p className="body-sm">
            Per modifiche o cancellazioni usa il link ricevuto nella conferma oppure contattaci su WhatsApp. Faremo il possibile per trovare una soluzione compatibile con disponibilita e organizzazione del tour.
          </p>
        </div>
      </div>
    </section>
  );
}
