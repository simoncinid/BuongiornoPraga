import { Building2, Send, Users } from "lucide-react";

export const metadata = {
  title: "Partner Europa",
  description: "Richieste per scuole, gruppi, hotel, travel blogger e agenzie partner a Praga.",
  alternates: {
    canonical: "/partner-europa"
  }
};

export default function PartnerEuropaPage() {
  return (
    <section className="section">
      <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="micro-label mb-2 text-muted">Partner Europa</p>
          <h1 className="display-xl mb-4">Canale dedicato per scuole, gruppi, hotel e agenzie.</h1>
          <p className="body-md mb-6">
            Raccontaci date, numero partecipanti ed esigenze logistiche: ti rispondiamo con una proposta chiara per tour privati, gruppi organizzati e collaborazioni locali.
          </p>
          <div className="grid gap-4">
            <div className="flex gap-3"><Users className="text-primary" /> <span>Preventivi per scuole e grandi gruppi.</span></div>
            <div className="flex gap-3"><Building2 className="text-primary" /> <span>Hotel e partner con un referente operativo dedicato.</span></div>
          </div>
        </div>
        <form className="card shadow-card grid gap-4 p-6">
          <label className="grid gap-2">
            <span className="caption text-ink">Nome referente</span>
            <input className="text-input" name="name" />
          </label>
          <label className="grid gap-2">
            <span className="caption text-ink">Email</span>
            <input className="text-input" name="email" type="email" />
          </label>
          <label className="grid gap-2">
            <span className="caption text-ink">Tipo richiesta</span>
            <select className="text-input" name="type">
              <option>Scuola</option>
              <option>Grande gruppo</option>
              <option>Hotel partner</option>
              <option>Agenzia di viaggio</option>
              <option>Travel blogger</option>
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="caption text-ink">Data indicativa</span>
              <input className="text-input" name="date" type="date" />
            </label>
            <label className="grid gap-2">
              <span className="caption text-ink">Partecipanti</span>
              <input className="text-input" name="people" type="number" min="1" />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="caption text-ink">Esigenze logistiche</span>
            <textarea className="text-input min-h-32" name="notes" />
          </label>
          <button className="button-primary" type="button">
            <Send size={18} /> Invia richiesta B2B
          </button>
        </form>
      </div>
    </section>
  );
}
