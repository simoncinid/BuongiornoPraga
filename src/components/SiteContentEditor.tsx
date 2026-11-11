"use client";
import { useState } from "react";
import type { SiteContent } from "@/lib/platform/content";
function Field({
  label,
  value,
  onChange,
  multi = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      {multi ? (
        <textarea
          className="text-input min-h-24"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="text-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
const labels: Record<string, string> = {
  brandName: "Nome del marchio",
  description: "Descrizione generale",
  email: "Email di assistenza",
  phone: "Telefono con prefisso internazionale",
  whatsappNumber: "Numero WhatsApp (solo cifre con prefisso)",
  address: "Punto d’incontro principale",
  supportHours: "Orari assistenza",
  footerText: "Testo del footer",
  footerNote: "Nota finale footer",
  tripAdvisorUrl: "Profilo TripAdvisor",
  tripAdvisorTitle: "Titolo sezione TripAdvisor",
  tripAdvisorBody: "Testo TripAdvisor",
  heroImage: "Immagine principale",
  heroTitle: "Titolo principale",
  heroEyebrow: "Sopratitolo principale",
  heroBody: "Introduzione",
  primaryLabel: "Testo pulsante principale",
  primaryHref: "Destinazione pulsante principale",
  secondaryLabel: "Testo pulsante WhatsApp",
  toursEyebrow: "Sopratitolo tour",
  toursTitle: "Titolo tour",
  toursBody: "Introduzione tour",
  trustEyebrow: "Sopratitolo fiducia",
  trustTitle: "Titolo fiducia",
  trustBody: "Introduzione fiducia",
  galleryEyebrow: "Sopratitolo galleria",
  galleryTitle: "Titolo galleria",
  galleryBody: "Introduzione galleria",
  answersTitle: "Titolo risposte rapide",
  answersBody: "Introduzione risposte rapide",
  partnerEyebrow: "Sopratitolo partner",
  partnerTitle: "Titolo partner",
  partnerBody: "Introduzione partner",
  partnerLabel: "Pulsante partner",
  faqTitle: "Titolo FAQ",
};
export function SiteContentEditor({
  initial,
  busy,
  save,
}: {
  initial: SiteContent;
  busy: boolean;
  save: (content: SiteContent) => Promise<unknown>;
}) {
  const [c, setC] = useState(initial),
    [tab, setTab] = useState("globals"),
    [notice, setNotice] = useState("");
  async function image(file: File, done: (url: string) => void) {
    setNotice("Caricamento foto…");
    try {
      const r = await fetch("/api/platform/admin/media", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      done(d.url);
      setNotice("Foto caricata: pubblica le modifiche per usarla.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Caricamento non riuscito");
    }
  }
  function rows(
    key:
      | "gallery"
      | "faqs"
      | "answers"
      | "socialLinks"
      | "navigation"
      | "stats"
      | "pillars",
    fields: string[],
    names: string[],
  ) {
    const group =
      key === "socialLinks" || key === "navigation"
        ? "globals"
        : key === "stats" || key === "pillars"
          ? "home"
          : null;
    const list = (group
      ? c[group][key as never]
      : c[key as "gallery"]) as unknown as Record<string, string>[];
    const update = (next: Record<string, string>[]) =>
      setC((p) =>
        group
          ? { ...p, [group]: { ...p[group], [key]: next } }
          : { ...p, [key]: next },
      );
    return (
      <div className="grid gap-5">
        {list.map((item, i) => (
          <div key={i} className="grid gap-4 rounded-xl border p-5">
            {fields.map((f, j) => (
              <Field
                key={f}
                label={names[j]}
                value={item[f]}
                multi={["text", "caption", "a", "answer"].includes(f)}
                onChange={(v) =>
                  update(list.map((x, k) => (k === i ? { ...x, [f]: v } : x)))
                }
              />
            ))}
            {key === "gallery" && (
              <label>
                Carica foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      image(f, (url) =>
                        update(
                          list.map((x, k) =>
                            k === i ? { ...x, imageUrl: url } : x,
                          ),
                        ),
                      );
                  }}
                />
              </label>
            )}
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                className="underline text-sm"
                disabled={i === 0}
                onClick={() => {
                  const next = [...list];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  update(next);
                }}
              >
                Sposta su
              </button>
              <button
                type="button"
                className="underline text-sm"
                onClick={() => update(list.filter((_, j) => j !== i))}
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="button-secondary"
          onClick={() =>
            update([
              ...list,
              Object.fromEntries(
                fields.map((f) => [f, f === "href" ? "/tour" : ""]),
              ),
            ])
          }
        >
          Aggiungi elemento
        </button>
      </div>
    );
  }
  const sectionKey: "globals" | "home" = tab === "globals" ? "globals" : "home";
  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save(c);
      }}
    >
      <nav className="flex flex-wrap gap-2">
        {[
          ["globals", "Contatti e identità"],
          ["home", "Sezioni home"],
          ["gallery", "Galleria"],
          ["faqs", "FAQ"],
          ["answers", "Risposte rapide"],
          ["navigation", "Menu"],
          ["socialLinks", "Social"],
          ["stats", "Dati in evidenza"],
          ["pillars", "Punti di forza"],
        ].map(([key, label]) => (
          <button
            type="button"
            className={tab === key ? "button-primary" : "button-secondary"}
            key={key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="card grid gap-5 p-6">
        <h2 className="display-md">Contenuti del sito</h2>
        <p className="text-sm">
          Questi contenuti sono condivisi tra pagine, footer, FAQ e dati per i
          motori di ricerca. Il titolo e l’introduzione home possono essere
          sostituiti dall’editor della pagina Homepage, se pubblicato.
        </p>
        {notice && <p role="status">{notice}</p>}
        {(tab === "globals" || tab === "home") &&
          Object.entries(c[sectionKey])
            .filter(([, v]) => typeof v === "string")
            .map(([key, value]) => (
              <Field
                key={key}
                label={labels[key] || key}
                value={value as string}
                multi={/Body|Text|Note|description/i.test(key)}
                onChange={(v) =>
                  setC((p) => ({
                    ...p,
                    [sectionKey]: { ...p[sectionKey], [key]: v },
                  }))
                }
              />
            ))}
        {tab === "home" && (
          <label>
            Carica immagine principale
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f)
                  image(f, (url) =>
                    setC((p) => ({
                      ...p,
                      home: { ...p.home, heroImage: url },
                    })),
                  );
              }}
            />
          </label>
        )}
        {tab === "gallery" &&
          rows(
            "gallery",
            ["title", "caption", "imageUrl"],
            ["Titolo foto", "Didascalia", "URL foto"],
          )}
        {tab === "faqs" && rows("faqs", ["q", "a"], ["Domanda", "Risposta"])}
        {tab === "answers" &&
          rows("answers", ["question", "answer"], ["Domanda", "Risposta"])}
        {tab === "socialLinks" &&
          rows(
            "socialLinks",
            ["label", "url"],
            ["Social", "URL profilo HTTPS"],
          )}
        {tab === "navigation" &&
          rows(
            "navigation",
            ["label", "href"],
            ["Voce menu", "Percorso sul sito"],
          )}
        {tab === "stats" &&
          rows("stats", ["value", "label"], ["Valore", "Descrizione"])}
        {tab === "pillars" &&
          rows("pillars", ["title", "text"], ["Titolo", "Testo"])}
      </div>
      <button className="button-primary" disabled={busy}>
        Pubblica contenuti
      </button>
    </form>
  );
}
