"use client";
import Link from "next/link";
import { SiteContentEditor } from "./SiteContentEditor";
import type { SiteContent } from "@/lib/platform/content";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Map,
  Ticket,
  Users,
  Mail,
  Settings2,
  FileText,
  RefreshCw,
  LogOut,
  Plus,
} from "lucide-react";
import type {
  Affiliate,
  CatalogTour,
  ContentPage,
  PlatformState,
  Reservation,
  Settings,
} from "@/lib/platform/model";
import { pragueLocal, pragueInstant } from "@/lib/platform/time";
import { formatMoney } from "@/lib/format";
type Data = Omit<PlatformState, "orders" | "rateLimits" | "events"> & {
  role: string;
  siteContent: SiteContent;
  integrations: Record<string, boolean>;
};
const navigation = [
  ["", "Panoramica", LayoutDashboard],
  ["prenotazioni", "Prenotazioni", Ticket],
  ["tour", "Tour e orari", Map],
  ["calendario", "Calendario", CalendarDays],
  ["affiliati", "Affiliati", Users],
  ["canali", "Canali OTA", RefreshCw],
  ["pre-tour", "Email e reminder", Mail],
  ["contenuti", "Contenuti", FileText],
  ["sito", "Home, FAQ e contatti", Settings2],
  ["richieste", "Richieste", Users],
  ["impostazioni", "Regole e tariffe", Settings2],
  ["report", "KPI e campagne", LayoutDashboard],
  ["audit", "Registro attività", FileText],
] as const;
const labels: Record<string, string> = {
  confirmed: "Confermata",
  pending: "In attesa",
  cancelled: "Cancellata",
  present: "Presente",
  no_show: "Assente",
  paid: "Pagato",
  not_required: "Saldo sul posto",
  refunded: "Rimborsato",
  failed: "Da verificare",
  queued: "In coda",
  running: "In corso",
  sent: "Inviato",
  review: "Da verificare",
  imported: "Importato",
  rejected: "Escluso",
};
function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  required = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input
        className="text-input"
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}
function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <textarea
        className="text-input min-h-28"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Chip({ value }: { value: string }) {
  return (
    <span
      className={`status-chip ${["paid", "confirmed", "present", "sent", "imported"].includes(value) ? "status-success" : ""}`}
    >
      {labels[value] || value}
    </span>
  );
}
function time(value: string) {
  return new Date(value).toLocaleString("it-IT", {
    timeZone: "Europe/Prague",
    dateStyle: "short",
    timeStyle: "short",
  });
}
export function AdminWorkspace() {
  const path = usePathname().split("/").filter(Boolean);
  const raw = path[1] || "";
  const section = ["prezzi", "sconti", "last-minute"].includes(raw)
    ? "impostazioni"
    : raw === "email"
      ? "pre-tour"
      : raw;
  const detail = path[2];
  const [data, setData] = useState<Data | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [tourFilter, setTourFilter] = useState(""),
    [dateFilter, setDateFilter] = useState(""),
    [slotFilter, setSlotFilter] = useState("");
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  async function load() {
    const r = await fetch("/api/platform/admin/state");
    if (r.status === 401) {
      window.location.replace("/accesso");
      return;
    }
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setData(d);
  }
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  async function mutate(route: string, body: unknown, method = "POST") {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch(`/api/platform/admin/${route}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
      setMessage("Operazione completata.");
      return d;
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Connessione non disponibile",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <section className="section container-page">
        <p role="status">{message || "Caricamento spazio di gestione…"}</p>
        <Link href="/accesso">Accedi</Link>
      </section>
    );
  if (
    data.role !== "admin" &&
    ["tour", "affiliati", "contenuti", "impostazioni", "sito"].includes(section)
  )
    return (
      <section className="section container-page">
        <h1 className="display-lg">
          Questa sezione richiede un amministratore.
        </h1>
        <Link className="button-secondary mt-6" href="/admin">
          Torna alla panoramica
        </Link>
      </section>
    );
  const slot = (b: Reservation) =>
    data.tours
      .find((t) => t.slug === b.tourSlug)
      ?.slots.find((s) => s.id === b.slotId);
  const filtered = data.bookings.filter(
    (b) =>
      (!tourFilter || b.tourSlug === tourFilter) &&
      (!dateFilter ||
        (slot(b) ? pragueLocal(slot(b)!.startsAt).slice(0, 10) : "") ===
          dateFilter) &&
      (!slotFilter || b.slotId === slotFilter) &&
      [b.name, b.pnr, b.email, b.phone, b.source]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const active = data.bookings.filter((b) => b.status !== "cancelled");
  const revenue = active.reduce((s, b) => s + b.totalCents, 0);
  const collected = active
    .filter((b) => b.paymentStatus === "paid")
    .reduce((s, b) => s + b.totalCents, 0);
  const table = (rows: Reservation[]) => (
    <>
      <div className="grid gap-4 md:hidden">
        {rows.map((b) => (
          <article className="card grid gap-3 p-5" key={b.id}>
            <div className="flex justify-between gap-3">
              <Link
                className="font-bold underline"
                href={`/admin/prenotazioni/${b.pnr}`}
              >
                {b.pnr}
              </Link>
              <Chip value={b.status} />
            </div>
            <strong>{b.name}</strong>
            <p>{data.tours.find((t) => t.slug === b.tourSlug)?.title}</p>
            <p className="text-sm">
              {slot(b) ? time(slot(b)!.startsAt) : b.slotId} · {b.totalGuests}{" "}
              partecipanti
            </p>
            <div className="flex justify-between">
              <strong>{formatMoney(b.totalCents)}</strong>
              <Chip value={b.paymentStatus} />
            </div>
          </article>
        ))}
        {!rows.length && <p>Nessuna prenotazione presente.</p>}
      </div>
      <div className="table-wrap hidden md:block">
        <table className="data-table">
          <thead>
            <tr>
              {[
                "Prenotazione",
                "Viaggiatore",
                "Esperienza / partenza",
                "Partecipanti",
                "Totale",
                "Stato",
                "Pagamento",
              ].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link
                    className="font-bold underline"
                    href={`/admin/prenotazioni/${b.pnr}`}
                  >
                    {b.pnr}
                  </Link>
                  <small className="block">{b.source}</small>
                </td>
                <td>
                  {b.name}
                  <small className="block">{b.email}</small>
                </td>
                <td>
                  {data.tours.find((t) => t.slug === b.tourSlug)?.title}
                  <small className="block">
                    {slot(b) ? time(slot(b)!.startsAt) : b.slotId}
                  </small>
                </td>
                <td>{b.totalGuests}</td>
                <td>{formatMoney(b.totalCents)}</td>
                <td>
                  <Chip value={b.status} />
                </td>
                <td>
                  <Chip value={b.paymentStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6">Nessuna prenotazione presente.</p>}
      </div>
    </>
  );
  const booking = detail ? data.bookings.find((b) => b.pnr === detail) : null;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          FreeTour<span className="site-brand-accent">Praga</span>
          <small className="mt-2 block text-xs">Spazio di gestione</small>
        </Link>
        <nav className="admin-nav admin-desktop-nav">
          {navigation
            .filter(
              ([slug]) =>
                data.role === "admin" ||
                ![
                  "tour",
                  "affiliati",
                  "contenuti",
                  "impostazioni",
                  "sito",
                ].includes(slug),
            )
            .map(([slug, label, Icon]) => (
              <Link
                key={slug}
                href={`/admin${slug ? "/" + slug : ""}`}
                className={section === slug ? "active" : ""}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
        </nav>
        <details className="admin-mobile-menu">
          <summary className="button-secondary">Apri menu gestionale</summary>
          <nav className="admin-nav mt-3">
            {navigation
              .filter(
                ([slug]) =>
                  data.role === "admin" ||
                  ![
                    "tour",
                    "affiliati",
                    "contenuti",
                    "impostazioni",
                    "sito",
                  ].includes(slug),
              )
              .map(([slug, label, Icon]) => (
                <Link key={slug} href={`/admin${slug ? "/" + slug : ""}`}>
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
          </nav>
        </details>
        <Link href="/" className="button-secondary">
          Vai al sito
        </Link>
        <button
          className="mt-4 flex gap-2 text-sm"
          onClick={async () => {
            await fetch("/api/platform/logout", { method: "POST" });
            window.location.assign("/accesso");
          }}
        >
          <LogOut size={16} />
          Esci
        </button>
      </aside>
      <div className="admin-main min-w-0">
        <header className="mb-7 flex flex-wrap justify-between gap-4">
          <div>
            <p className="micro-label text-primary">
              Operatività · Europe/Prague
            </p>
            <h1 className="display-lg mt-2">
              {navigation.find((n) => n[0] === section)?.[1] || "Gestione"}
            </h1>
          </div>
          <button
            onClick={() => load().catch((e) => setMessage(e.message))}
            className="button-secondary"
          >
            <RefreshCw size={16} />
            Aggiorna
          </button>
        </header>
        {message && (
          <p role="status" className="card mb-6 border-l-4 border-primary p-4">
            {message}
          </p>
        )}
        {section === "" && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Prenotazioni attive", active.length],
                ["Vendite", formatMoney(revenue)],
                ["Incassato", formatMoney(collected)],
                ["Da incassare", formatMoney(revenue - collected)],
              ].map(([label, value]) => (
                <div className="card p-6" key={label}>
                  <p className="text-sm">{label}</p>
                  <strong className="mt-3 block text-3xl text-ink">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
            <div className="card mb-7 p-6">
              <h2 className="display-md mb-4">Servizi e automazioni</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.integrations).map(([k, v]) => (
                  <span className="status-chip" key={k}>
                    {k}: {v ? "configurato" : "da collegare"}
                  </span>
                ))}
              </div>
              {!data.integrations.database && (
                <p className="mt-4 text-sm">
                  Ambiente locale: dati persistenti su questo computer. Per la
                  produzione attivare PostgreSQL.
                </p>
              )}
            </div>
            <div className="mb-4 flex flex-wrap gap-3">
              <Link href="/admin/prenotazioni/nuova" className="button-primary">
                Inserisci prenotazione
              </Link>
              <Link href="/admin/calendario" className="button-secondary">
                Prossime partenze
              </Link>
            </div>
            {table(data.bookings.slice().reverse().slice(0, 15))}
          </>
        )}
        {section === "prenotazioni" &&
          (detail === "nuova" ? (
            <ManualBooking
              tours={data.tours}
              busy={busy}
              save={(input) => mutate("manual", input)}
            />
          ) : booking ? (
            <BookingDetail
              booking={booking}
              tour={data.tours.find((t) => t.slug === booking.tourSlug)!}
              busy={busy}
              save={(body) => mutate("booking", body, "PATCH")}
            />
          ) : (
            <>
              <div className="card mb-6 grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Cerca nome, PNR, email"
                  value={search}
                  onChange={setSearch}
                />
                <label>
                  Tour
                  <select
                    className="text-input"
                    value={tourFilter}
                    onChange={(e) => {
                      setTourFilter(e.target.value);
                      setSlotFilter("");
                    }}
                  >
                    <option value="">Tutti i tour</option>
                    {data.tours.map((t) => (
                      <option key={t.id} value={t.slug}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Data"
                  value={dateFilter}
                  onChange={setDateFilter}
                  type="date"
                />
                <label>
                  Partenza
                  <select
                    className="text-input"
                    value={slotFilter}
                    onChange={(e) => setSlotFilter(e.target.value)}
                  >
                    <option value="">Tutti gli orari</option>
                    {data.tours
                      .filter((t) => !tourFilter || t.slug === tourFilter)
                      .flatMap((t) => t.slots)
                      .map((s) => (
                        <option value={s.id} key={s.id}>
                          {time(s.startsAt)}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <div className="mb-5 flex flex-wrap gap-3">
                <Link
                  className="button-primary"
                  href="/admin/prenotazioni/nuova"
                >
                  <Plus size={17} />
                  Nuova prenotazione
                </Link>
                <a
                  className="button-secondary"
                  href="/api/platform/admin/export"
                >
                  Esporta CSV
                </a>
              </div>
              {table(filtered.slice().reverse())}
            </>
          ))}
        {section === "tour" &&
          (detail ? (
            <TourEditor
              key={detail}
              tour={
                data.tours.find((t) => t.slug === detail) || {
                  ...structuredClone(data.tours[0]),
                  id: crypto.randomUUID(),
                  slug: "nuovo-tour",
                  title: "Nuovo tour",
                  published: false,
                  slots: [],
                }
              }
              busy={busy}
              save={(t) => mutate("tour", t, "PUT")}
            />
          ) : (
            <>
              <Link className="button-primary mb-6" href="/admin/tour/nuovo">
                Crea un tour
              </Link>
              <div className="grid gap-5">
                {data.tours.map((t) => (
                  <article
                    className="card flex flex-wrap justify-between gap-4 p-6"
                    key={t.id}
                  >
                    <div>
                      <h2 className="display-md">{t.title}</h2>
                      <p>
                        {t.slots.length} partenze · da{" "}
                        {formatMoney(t.basePriceCents)} ·{" "}
                        {t.published ? "Pubblicato" : "Bozza"}
                      </p>
                    </div>
                    <Link
                      className="button-secondary"
                      href={`/admin/tour/${t.slug}`}
                    >
                      Modifica
                    </Link>
                  </article>
                ))}
              </div>
            </>
          ))}
        {section === "calendario" && (
          <>
            <div className="mb-6 flex flex-wrap items-end gap-4">
              <Field
                label="Mese"
                type="month"
                value={month}
                onChange={setMonth}
              />
              <label>
                Tour
                <select
                  className="text-input"
                  value={tourFilter}
                  onChange={(e) => setTourFilter(e.target.value)}
                >
                  <option value="">Tutti</option>
                  {data.tours.map((t) => (
                    <option key={t.id} value={t.slug}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4">
              {data.tours
                .filter((t) => !tourFilter || t.slug === tourFilter)
                .flatMap((t) =>
                  t.slots
                    .filter((s) => pragueLocal(s.startsAt).startsWith(month))
                    .map((s) => ({ ...s, tour: t })),
                )
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                .map((s) => (
                  <article className="card grid gap-3 p-5" key={s.id}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <h2 className="font-bold text-ink">
                        {time(s.startsAt)} · {s.tour.title}
                      </h2>
                      <span>
                        {s.reserved}/{s.capacity} posti ·{" "}
                        {s.tour.guide || "Guida da assegnare"}
                      </span>
                    </div>
                    <meter
                      min={0}
                      max={s.capacity}
                      value={s.reserved}
                      className="w-full"
                      aria-label="Posti riservati"
                    />
                    {data.bookings
                      .filter(
                        (b) => b.slotId === s.id && b.status !== "cancelled",
                      )
                      .map((b) => (
                        <Link
                          className="text-sm underline"
                          key={b.id}
                          href={`/admin/prenotazioni/${b.pnr}`}
                        >
                          {b.name} · {b.totalGuests} persone · {b.pnr}
                        </Link>
                      ))}
                    <Link
                      href={`/admin/tour/${s.tour.slug}`}
                      className="text-sm underline"
                    >
                      Gestisci partenza
                    </Link>
                  </article>
                ))}
            </div>
          </>
        )}
        {section === "impostazioni" && (
          <SettingsEditor
            key={JSON.stringify(data.settings)}
            settings={data.settings}
            busy={busy}
            save={(s) => mutate("settings", s, "PUT")}
          />
        )}
        {section === "affiliati" && (
          <>
            <AffiliateEditor
              busy={busy}
              save={(a) => mutate("affiliate", a, "PUT")}
            />
            <div className="mt-7 grid gap-5">
              {data.affiliates.map((a) => {
                const rows = data.bookings.filter(
                  (b) => b.affiliateCode === a.code,
                );
                const payable = rows.filter(
                  (b) => b.status === "present" && !b.commissionPaid,
                );
                return (
                  <article className="card p-6" key={a.code}>
                    <div className="flex flex-wrap justify-between gap-4">
                      <div>
                        <h2 className="display-md">{a.name}</h2>
                        <p>
                          {a.type} · {a.code} · {a.commissionPercent}% ·{" "}
                          {a.active ? "Attivo" : "Sospeso"}
                        </p>
                        <p>
                          {rows.length} prenotazioni · maturato da liquidare{" "}
                          {formatMoney(
                            payable.reduce((s, b) => s + b.commissionCents, 0),
                          )}
                        </p>
                        <a
                          className="block break-all text-sm underline"
                          href={`/?ref=${a.code}`}
                        >
                          {typeof window !== "undefined"
                            ? window.location.origin
                            : ""}
                          /?ref={a.code}
                        </a>
                      </div>
                      <a
                        href={`/api/platform/admin/affiliate/qr?code=${a.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="button-secondary"
                      >
                        Scarica QR
                      </a>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        className="button-secondary"
                        disabled={busy}
                        onClick={() =>
                          mutate(
                            "affiliate",
                            { ...a, active: !a.active },
                            "PUT",
                          )
                        }
                      >
                        {a.active ? "Sospendi" : "Riattiva"}
                      </button>
                      <button
                        className="button-secondary"
                        disabled={busy || !payable.length}
                        onClick={() =>
                          mutate("commissions/pay", { code: a.code })
                        }
                      >
                        Registra liquidazione
                      </button>
                    </div>
                    <details className="mt-5">
                      <summary>Report prenotazioni</summary>
                      {table(rows)}
                    </details>
                  </article>
                );
              })}
            </div>
          </>
        )}
        {section === "canali" && (
          <>
            <OtaImport busy={busy} save={(b) => mutate("ota", b)} />
            <div className="mt-7 grid gap-5">
              {data.ota
                .slice()
                .reverse()
                .map((m) => (
                  <article className="card p-6" key={m.id}>
                    <div className="flex flex-wrap justify-between">
                      <h2 className="font-bold">
                        {m.provider} · {m.reference}
                      </h2>
                      <Chip value={m.status} />
                    </div>
                    <p className="mt-3 text-sm">{m.error}</p>
                    <details className="my-4">
                      <summary>Email originale</summary>
                      <pre className="mt-3 whitespace-pre-wrap break-words text-xs">
                        {m.raw}
                      </pre>
                    </details>
                    {m.status === "review" && !m.pnr && (
                      <ManualBooking
                        tours={data.tours}
                        busy={busy}
                        save={(booking) =>
                          mutate("ota/approve", { id: m.id, booking })
                        }
                      />
                    )}
                    {m.status === "review" && (
                      <button
                        className="button-secondary"
                        disabled={busy}
                        onClick={() => mutate("ota/close", { id: m.id })}
                      >
                        Chiudi revisione
                      </button>
                    )}
                    {m.pnr && (
                      <Link
                        className="underline"
                        href={`/admin/prenotazioni/${m.pnr}`}
                      >
                        {m.pnr}
                      </Link>
                    )}
                  </article>
                ))}
            </div>
          </>
        )}
        {section === "pre-tour" && (
          <>
            <div className="card mb-6 p-6">
              <h2 className="display-md mb-3">Comunicazioni automatiche</h2>
              <p>
                Conferme e modifiche via email. Reminder WhatsApp{" "}
                {data.settings.reminderHours} ore prima, per i clienti che hanno
                dato il consenso. Gli invii non riusciti vengono ritentati
                automaticamente.
              </p>
              <button
                className="button-secondary mt-4"
                disabled={busy}
                onClick={() => mutate("jobs/run", {})}
              >
                Elabora coda ora
              </button>
            </div>
            <div className="grid gap-4">
              {data.jobs
                .slice()
                .reverse()
                .map((j) => (
                  <article className="card p-5" key={j.id}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <strong>
                        {j.type} · {j.bookingPnr || j.subject}
                      </strong>
                      <Chip value={j.status} />
                    </div>
                    <p className="my-2 text-sm">
                      {j.to} · {time(j.runAt)} · {j.attempts} tentativi
                    </p>
                    {j.error && (
                      <p className="text-sm text-red-700">{j.error}</p>
                    )}
                    <details className="mt-3">
                      <summary>Anteprima</summary>
                      <p className="mt-3 whitespace-pre-wrap text-sm">
                        {j.text || `Rimborso ${formatMoney(j.amount || 0)}`}
                      </p>
                    </details>
                    {j.status === "failed" && (
                      <button
                        className="button-secondary mt-3"
                        onClick={() => mutate("jobs/retry", { id: j.id })}
                      >
                        Riprova
                      </button>
                    )}
                  </article>
                ))}
            </div>
          </>
        )}
        {section === "sito" && (
          <SiteContentEditor
            initial={data.siteContent}
            busy={busy}
            save={(c) => mutate("site-content", c, "PUT")}
          />
        )}
        {section === "contenuti" && (
          <ContentEditor
            key={detail || "home"}
            pages={data.pages}
            pageKey={detail || "homepage"}
            busy={busy}
            save={(b) => mutate("page", b, "PUT")}
          />
        )}
        {section === "richieste" && (
          <div className="grid gap-4">
            {!data.inquiries.length && <p>Nessuna richiesta ricevuta.</p>}
            {data.inquiries
              .slice()
              .reverse()
              .map((i) => (
                <article className="card p-6" key={i.id}>
                  <h2 className="display-md">
                    {i.type} · {i.name}
                  </h2>
                  <p className="my-2">
                    {i.email} · {time(i.createdAt)}
                  </p>
                  <p className="whitespace-pre-wrap">{i.message}</p>
                  <button
                    className="button-secondary mt-4"
                    onClick={() =>
                      mutate(
                        "inquiry",
                        {
                          id: i.id,
                          status: i.status === "new" ? "handled" : "new",
                        },
                        "PATCH",
                      )
                    }
                  >
                    {i.status === "new"
                      ? "Segna come gestita"
                      : "Riapri richiesta"}
                  </button>
                </article>
              ))}
          </div>
        )}
        {section === "report" && (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {["site", "civitatis", "getyourguide", "manual"].map((source) => {
                const rows = active.filter((b) => b.source.startsWith(source));
                return (
                  <div className="card p-6" key={source}>
                    <h2 className="display-md">{source}</h2>
                    <p className="my-3">
                      {rows.length} prenotazioni ·{" "}
                      {formatMoney(rows.reduce((s, b) => s + b.totalCents, 0))}
                    </p>
                    <p className="text-sm">
                      Partecipanti:{" "}
                      {rows.reduce((s, b) => s + b.totalGuests, 0)}
                    </p>
                  </div>
                );
              })}
              <div className="card p-6">
                <h2 className="display-md">Qualità operativa</h2>
                <p className="mt-4">
                  Cancellazioni:{" "}
                  {data.bookings.filter((b) => b.status === "cancelled").length}
                </p>
                <p>
                  Assenti:{" "}
                  {data.bookings.filter((b) => b.status === "no_show").length}
                </p>
                <p>
                  Commissioni non liquidate:{" "}
                  {formatMoney(
                    active
                      .filter((b) => !b.commissionPaid)
                      .reduce((s, b) => s + b.commissionCents, 0),
                  )}
                </p>
              </div>
              <div className="card p-6">
                <h2 className="display-md">Google Ads</h2>
                <p className="mt-4">
                  {data.settings.googleAdsId
                    ? `Account tag: ${data.settings.googleAdsId}`
                    : "Tag non ancora configurato."}
                </p>
                <p className="my-3 text-sm">
                  Il tracciamento acquisti si attiva con il consenso marketing e
                  solo sulle prenotazioni confermate.
                </p>
                <Link href="/admin/impostazioni" className="underline">
                  Configura conversioni
                </Link>
              </div>
            </div>
            <a
              className="button-secondary mt-6"
              href="/api/platform/admin/export"
            >
              Scarica dati prenotazioni
            </a>
          </>
        )}
        {section === "audit" && (
          <div className="card p-6">
            <h2 className="display-md mb-5">Storico delle operazioni</h2>
            {data.audit.map((a) => (
              <p className="border-b py-3 text-sm" key={a.id}>
                {time(a.at)} · {a.actor} · {a.action} · {a.target}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function ManualBooking({
  tours,
  busy,
  save,
}: {
  tours: CatalogTour[];
  busy: boolean;
  save: (v: unknown) => Promise<unknown>;
}) {
  const [tour, setTour] = useState(tours[0]?.slug || "");
  const [message, setMessage] = useState("");
  const selected = tours.find((t) => t.slug === tour);
  return (
    <form
      className="card grid gap-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = await save({
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone"),
          items: [
            {
              tourSlug: tour,
              slotId: f.get("slotId"),
              adults: Number(f.get("adults")),
              children: Number(f.get("children")),
              infants: Number(f.get("infants")),
            },
          ],
          paymentMethod: "cash",
          notes: f.get("notes"),
          affiliateCode: "",
          termsAccepted: true,
          whatsappConsent: f.get("whatsapp") === "on",
        });
        if (r) setMessage("Prenotazione registrata.");
      }}
    >
      <h2 className="display-md">Inserimento prenotazione</h2>
      <div className="form-grid">
        <label>
          Tour
          <select
            className="text-input"
            value={tour}
            onChange={(e) => setTour(e.target.value)}
          >
            {tours.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Partenza
          <select name="slotId" required className="text-input">
            {selected?.slots
              .filter((s) => new Date(s.startsAt).getTime() > Date.now())
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {time(s.startsAt)} · {s.capacity - s.reserved} posti
                </option>
              ))}
          </select>
        </label>
        {[
          ["Nome cliente", "name", "text"],
          ["Email", "email", "email"],
          ["Telefono internazionale", "phone", "tel"],
          ["Adulti", "adults", "number"],
          ["Bambini", "children", "number"],
          ["Infanti", "infants", "number"],
        ].map(([label, name, type]) => (
          <label key={name}>
            {label}
            <input
              name={name}
              type={type}
              required
              className="text-input"
              min={name === "adults" ? 1 : 0}
              defaultValue={
                type === "number" ? (name === "adults" ? 1 : 0) : undefined
              }
            />
          </label>
        ))}
      </div>
      <label>
        Note
        <textarea name="notes" className="text-input" />
      </label>
      <label className="flex gap-3 text-sm">
        <input name="whatsapp" type="checkbox" />
        Consenso WhatsApp raccolto dal cliente
      </label>
      <label className="flex gap-3 text-sm">
        <input required type="checkbox" />
        Confermo che il cliente ha accettato le condizioni di prenotazione.
      </label>
      <button disabled={busy} className="button-primary">
        Registra e invia conferma
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
function BookingDetail({
  booking: b,
  tour,
  busy,
  save,
}: {
  booking: Reservation;
  tour: CatalogTour;
  busy: boolean;
  save: (b: unknown) => Promise<unknown>;
}) {
  const [notes, setNotes] = useState(b.notes);
  const [name, setName] = useState(b.name),
    [email, setEmail] = useState(b.email),
    [phone, setPhone] = useState(b.phone);
  const [adults, setAdults] = useState(b.adults),
    [children, setChildren] = useState(b.children),
    [infants, setInfants] = useState(b.infants);
  const [status, setStatus] = useState(b.status);
  const [payment, setPayment] = useState(b.paymentStatus);
  const [notify, setNotify] = useState(false);
  const [slotId, setSlot] = useState(b.slotId);
  const [reason, setReason] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  return (
    <div className="grid gap-5">
      <Link href="/admin/prenotazioni" className="underline">
        ← Prenotazioni
      </Link>
      <div className="card grid gap-5 p-6">
        <h2 className="display-md">
          {b.pnr} · {b.name}
        </h2>
        <p>
          {b.email} · {b.phone}
        </p>
        <p>
          {tour.title} · {b.adults} adulti, {b.children} bambini, {b.infants}{" "}
          infanti
        </p>
        <p>
          {formatMoney(b.totalCents)} · sconto {formatMoney(b.discountCents)} ·{" "}
          {b.source}
        </p>
        <div className="flex gap-3">
          <Chip value={b.status} />
          <Chip value={b.paymentStatus} />
        </div>
        <div className="form-grid">
          <Field label="Nome cliente" value={name} onChange={setName} />
          <Field
            label="Email cliente"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <Field
            label="Telefono internazionale"
            value={phone}
            onChange={setPhone}
          />
        </div>
        {b.paymentMethod === "cash" && b.paymentStatus !== "paid" && (
          <div className="form-grid">
            <Field
              label="Adulti"
              type="number"
              min={1}
              max={100}
              value={adults}
              onChange={(v) => setAdults(Number(v))}
            />
            <Field
              label="Bambini"
              type="number"
              min={0}
              max={100}
              value={children}
              onChange={(v) => setChildren(Number(v))}
            />
            <Field
              label="Infanti"
              type="number"
              min={0}
              max={100}
              value={infants}
              onChange={(v) => setInfants(Number(v))}
            />
          </div>
        )}
        <Text label="Note operative" value={notes} onChange={setNotes} />
        <div className="form-grid">
          <label>
            Partecipazione
            <select
              className="text-input"
              value={status}
              disabled={b.status === "pending"}
              onChange={(e) =>
                setStatus(e.target.value as Reservation["status"])
              }
            >
              {[
                ...(b.status === "pending" ? ["pending"] : []),
                "confirmed",
                "present",
                "no_show",
              ].map((x) => (
                <option key={x} value={x}>
                  {labels[x]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Stato pagamento
            <select
              className="text-input"
              disabled={b.paymentMethod === "stripe"}
              value={payment}
              onChange={(e) =>
                setPayment(e.target.value as Reservation["paymentStatus"])
              }
            >
              {["not_required", "paid", "pending"].map((x) => (
                <option key={x} value={x}>
                  {labels[x]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
          />
          Invia notifica al cliente
        </label>
        <button
          className="button-primary"
          disabled={busy || b.status === "cancelled"}
          onClick={() =>
            save({
              pnr: b.pnr,
              action: "update",
              notes,
              name,
              email,
              phone,
              adults,
              children,
              infants,
              ...(b.status !== "pending" ? { status } : {}),
              ...(b.paymentMethod !== "stripe"
                ? { paymentStatus: payment }
                : {}),
              notify,
            })
          }
        >
          Salva aggiornamenti
        </button>
      </div>
      {b.status === "cancelled" && b.refundStatus === "manual" && (
        <div className="card grid gap-4 p-6">
          <h2 className="display-md">Rimborso da completare</h2>
          <p>
            Importo: {formatMoney(b.refundCents || 0)}. Esegui il rimborso in
            contanti o sul portale OTA, poi registralo.
          </p>
          <label className="flex gap-3">
            <input
              type="checkbox"
              checked={confirmRefund}
              onChange={(e) => setConfirmRefund(e.target.checked)}
            />
            Confermo che il rimborso è stato effettivamente eseguito.
          </label>
          <button
            className="button-secondary"
            disabled={busy || !confirmRefund}
            onClick={() =>
              save({ pnr: b.pnr, action: "refund-record", confirmRefund: true })
            }
          >
            Registra rimborso effettuato
          </button>
        </div>
      )}
      <div className="card grid gap-4 p-6">
        <h2 className="display-md">Sposta su un’altra partenza</h2>
        <select
          className="text-input"
          value={slotId}
          onChange={(e) => setSlot(e.target.value)}
        >
          {tour.slots.map((s) => (
            <option value={s.id} key={s.id}>
              {time(s.startsAt)} · {s.capacity - s.reserved} posti
            </option>
          ))}
        </select>
        <button
          className="button-secondary"
          disabled={busy || b.status !== "confirmed"}
          onClick={() => save({ pnr: b.pnr, action: "move", slotId })}
        >
          Sposta e notifica
        </button>
      </div>
      <details className="card p-6">
        <summary>Cancellazione prenotazione</summary>
        <div className="mt-4 grid gap-4">
          <Text label="Motivo" value={reason} onChange={setReason} />
          <p className="text-sm">
            Si applica la policy di rimborso configurata; i posti vengono
            liberati.
          </p>
          <button
            disabled={busy || reason.length < 2 || b.status === "cancelled"}
            className="button-secondary"
            onClick={() => save({ pnr: b.pnr, action: "cancel", reason })}
          >
            Cancella e notifica
          </button>
        </div>
      </details>
    </div>
  );
}
function TourEditor({
  tour,
  busy,
  save,
}: {
  tour: CatalogTour;
  busy: boolean;
  save: (t: CatalogTour) => Promise<unknown>;
}) {
  const [t, setT] = useState(tour);
  const [uploadMessage, setUploadMessage] = useState("");
  const set = (key: keyof CatalogTour, value: unknown) =>
    setT((p) => ({ ...p, [key]: value }));
  const fields: [keyof CatalogTour, string, string?][] = [
    ["title", "Titolo"],
    ["slug", "Indirizzo pagina (slug)"],
    ["category", "Categoria"],
    ["language", "Lingua"],
    ["durationMinutes", "Durata in minuti", "number"],
    ["maxGuests", "Dimensione gruppo", "number"],
    ["imageUrl", "URL foto"],
    ["meetingPoint", "Punto d’incontro"],
    ["meetingAddress", "Indirizzo"],
    ["mapUrl", "Link Google Maps"],
    ["mapEmbedUrl", "Mappa incorporata"],
    ["latitude", "Latitudine", "number"],
    ["longitude", "Longitudine", "number"],
    ["guide", "Guida assegnata"],
    ["basePriceCents", "Prezzo adulti (centesimi)", "number"],
    ["childPriceCents", "Prezzo bambini (centesimi)", "number"],
    ["infantPriceCents", "Prezzo infanti (centesimi)", "number"],
    ["adultMinAge", "Età minima adulti", "number"],
    ["childMinAge", "Età minima bambini", "number"],
    ["bookingCutoffHours", "Chiusura prenotazioni (ore prima)", "number"],
    ["seoTitle", "Titolo SEO"],
    ["seoDescription", "Descrizione SEO"],
  ];
  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save({
          ...t,
          slots: t.slots.map((s) => ({
            ...s,
            startsAt: new Date(s.startsAt).toISOString(),
            endsAt: new Date(s.endsAt).toISOString(),
          })),
        });
      }}
    >
      <Link href="/admin/tour" className="underline">
        ← Tour e orari
      </Link>
      <div className="card grid gap-5 p-6">
        <h2 className="display-md">Informazioni e tariffe</h2>
        <label>
          Carica foto (JPEG, PNG o WebP; massimo 5 MB)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadMessage("Caricamento…");
              try {
                const r = await fetch("/api/platform/admin/media", {
                  method: "POST",
                  headers: { "Content-Type": file.type },
                  body: file,
                });
                const d = await r.json();
                if (!r.ok) throw Error(d.error);
                set("imageUrl", d.url);
                setUploadMessage(
                  "Foto caricata. Salva il tour per pubblicarla.",
                );
              } catch (e) {
                setUploadMessage(
                  e instanceof Error ? e.message : "Errore caricamento",
                );
              }
            }}
          />
        </label>
        {uploadMessage && <p role="status">{uploadMessage}</p>}
        <div className="form-grid">
          {fields.map(([key, label, type]) => (
            <Field
              key={key}
              label={label}
              type={type}
              value={String(t[key] ?? "")}
              onChange={(v) => set(key, type === "number" ? Number(v) : v)}
            />
          ))}
        </div>
        <Text
          label="Introduzione"
          value={t.shortDescription}
          onChange={(v) => set("shortDescription", v)}
        />
        <Text
          label="Descrizione completa"
          value={t.description}
          onChange={(v) => set("description", v)}
        />
        {(
          [
            ["highlights", "Punti salienti (uno per riga)"],
            ["inclusions", "Servizi inclusi (uno per riga)"],
            ["safetyNotes", "Informazioni pratiche (una per riga)"],
          ] as const
        ).map(([key, label]) => (
          <Text
            key={key}
            label={label}
            value={t[key].join("\n")}
            onChange={(v) => set(key, v.split("\n"))}
          />
        ))}
        <Text
          label="Titoli o ID attività OTA (uno per riga)"
          value={(t.otaAliases || []).join("\n")}
          onChange={(v) => set("otaAliases", v.split("\n").filter(Boolean))}
        />
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={t.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          Pubblica sul sito
        </label>
      </div>
      <div className="card grid gap-5 p-6">
        <h2 className="display-md">Partenze e disponibilità</h2>
        <p className="text-sm">
          Inserisci gli orari con il fuso corretto. Il calendario mostra sempre
          l’ora di Praga. I posti riservati sono calcolati dal sistema.
        </p>
        {t.slots.map((s, i) => (
          <div key={s.id} className="grid gap-4 border-b pb-5 sm:grid-cols-2">
            <Field
              label="Inizio (ora di Praga)"
              type="datetime-local"
              value={pragueLocal(s.startsAt)}
              onChange={(v) =>
                set(
                  "slots",
                  t.slots.map((x, j) =>
                    j === i ? { ...x, startsAt: safePrague(v, x.startsAt) } : x,
                  ),
                )
              }
            />
            <Field
              label="Fine (ora di Praga)"
              type="datetime-local"
              value={pragueLocal(s.endsAt)}
              onChange={(v) =>
                set(
                  "slots",
                  t.slots.map((x, j) =>
                    j === i ? { ...x, endsAt: safePrague(v, x.endsAt) } : x,
                  ),
                )
              }
            />
            <Field
              label={`Capienza · ${s.reserved} posti riservati`}
              type="number"
              min={s.reserved || 1}
              max={500}
              value={s.capacity}
              onChange={(v) =>
                set(
                  "slots",
                  t.slots.map((x, j) =>
                    j === i ? { ...x, capacity: Number(v) } : x,
                  ),
                )
              }
            />
            <button
              type="button"
              className="text-sm underline"
              disabled={s.reserved > 0}
              onClick={() =>
                set(
                  "slots",
                  t.slots.filter((_, j) => j !== i),
                )
              }
            >
              Rimuovi partenza
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button-secondary"
          onClick={() =>
            set("slots", [
              ...t.slots,
              {
                id: crypto.randomUUID(),
                tourId: t.id,
                startsAt: new Date(Date.now() + 86400000).toISOString(),
                endsAt: new Date(
                  Date.now() + 86400000 + t.durationMinutes * 60000,
                ).toISOString(),
                capacity: t.maxGuests,
                reserved: 0,
              },
            ])
          }
        >
          Aggiungi partenza
        </button>
      </div>
      <button className="button-primary" disabled={busy}>
        Salva tour e partenze
      </button>
    </form>
  );
}
function SettingsEditor({
  settings,
  busy,
  save,
}: {
  settings: Settings;
  busy: boolean;
  save: (s: Settings) => Promise<unknown>;
}) {
  const [s, setS] = useState(settings);
  const field = (key: keyof Settings, label: string, type = "number") => (
    <Field
      key={key}
      label={label}
      type={type}
      value={s[key]}
      onChange={(v) =>
        setS((p) => ({ ...p, [key]: type === "number" ? Number(v) : v }))
      }
    />
  );
  return (
    <form
      className="card grid gap-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        save(s);
      }}
    >
      <h2 className="display-md">Regole commerciali e automazioni</h2>
      <div className="form-grid">
        {field("multiTourPercent", "Sconto multi-tour (%)")}
        {field("minimumTours", "Numero minimo di tour diversi")}
        {field(
          "cancellationHours",
          "Cancellazione gratuita fino a (ore prima)",
        )}
        {field("lateRefundPercent", "Rimborso dopo il termine (%)")}
        {field("reminderHours", "Reminder WhatsApp (ore prima)")}
        {field("retentionDays", "Conservazione dati (giorni)")}
        {field("googleAdsId", "Google Ads ID (AW-…)", "text")}
        {field("googleAdsLabel", "Etichetta conversione acquisto", "text")}
      </div>
      <Text
        label="Firma email"
        value={s.emailFooter}
        onChange={(v) => setS((p) => ({ ...p, emailFooter: v }))}
      />
      <p className="text-sm">
        Le tariffe e le fasce d’età si gestiscono per ciascun tour. I nuovi
        valori valgono per le nuove prenotazioni. Le prenotazioni esistenti
        conservano il prezzo concordato.
      </p>
      <button className="button-primary" disabled={busy}>
        Salva regole
      </button>
    </form>
  );
}
function AffiliateEditor({
  busy,
  save,
}: {
  busy: boolean;
  save: (a: Affiliate) => Promise<unknown>;
}) {
  const [a, setA] = useState<Affiliate>({
    code: "",
    name: "",
    email: "",
    type: "hotel",
    commissionPercent: 10,
    active: true,
  });
  return (
    <form
      className="card grid gap-5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        save(a);
      }}
    >
      <h2 className="display-md">Crea o aggiorna un affiliato</h2>
      <div className="form-grid">
        <Field
          label="Codice univoco"
          value={a.code}
          onChange={(v) => setA({ ...a, code: v.toUpperCase() })}
          required
        />
        <Field
          label="Nome"
          value={a.name}
          onChange={(v) => setA({ ...a, name: v })}
          required
        />
        <Field
          label="Email"
          type="email"
          value={a.email}
          onChange={(v) => setA({ ...a, email: v })}
          required
        />
        <Field
          label="Commissione (%)"
          type="number"
          min={0}
          max={100}
          value={a.commissionPercent}
          onChange={(v) => setA({ ...a, commissionPercent: Number(v) })}
        />
        <label>
          Tipologia
          <select
            className="text-input"
            value={a.type}
            onChange={(e) =>
              setA({ ...a, type: e.target.value as Affiliate["type"] })
            }
          >
            {["hotel", "guide", "promoter", "agency"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm">
        La commissione matura dopo la partecipazione. Le prenotazioni cancellate
        sono escluse. Inserisci un codice esistente per aggiornare il partner.
      </p>
      <button disabled={busy} className="button-primary">
        Salva affiliato
      </button>
    </form>
  );
}
function OtaImport({
  busy,
  save,
}: {
  busy: boolean;
  save: (b: unknown) => Promise<unknown>;
}) {
  return (
    <form
      className="card grid gap-5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        save(Object.fromEntries(f));
      }}
    >
      <h2 className="display-md">Importa email OTA</h2>
      <p className="text-sm">
        Le email della casella collegata arrivano automaticamente. Puoi anche
        incollare un messaggio: i formati non riconosciuti restano da verificare
        e non occupano posti.
      </p>
      <label>
        Provider
        <select name="provider" className="text-input">
          <option value="civitatis">Civitatis</option>
          <option value="getyourguide">GetYourGuide</option>
        </select>
      </label>
      <label>
        Riferimento prenotazione provider
        <input className="text-input" name="reference" required minLength={2} />
      </label>
      <label>
        Corpo email
        <textarea
          className="text-input min-h-40"
          name="raw"
          required
          minLength={10}
        />
      </label>
      <button className="button-primary" disabled={busy}>
        Analizza e importa
      </button>
    </form>
  );
}
function ContentEditor({
  pages,
  pageKey,
  busy,
  save,
}: {
  pages: Record<string, ContentPage>;
  pageKey: string;
  busy: boolean;
  save: (b: unknown) => Promise<unknown>;
}) {
  const [p, setP] = useState<ContentPage>(
    pages[pageKey] || {
      title: "",
      subtitle: "",
      body: "",
      seoTitle: "",
      seoDescription: "",
      published: false,
    },
  );
  return (
    <div className="grid gap-6">
      <nav className="flex flex-wrap gap-2">
        {[
          "homepage",
          "catalogo",
          "tour-privati",
          "partner-europa",
          "faq",
          "contatti",
          "privacy",
          "termini",
        ].map((k) => (
          <Link
            key={k}
            className="button-secondary !px-3 !py-2"
            href={`/admin/contenuti/${k}`}
          >
            {k}
          </Link>
        ))}
      </nav>
      <form
        className="card grid gap-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save({ key: pageKey, page: p });
        }}
      >
        <h2 className="display-md">{pageKey}</h2>
        <Field
          label="Titolo"
          required
          value={p.title}
          onChange={(v) => setP({ ...p, title: v })}
        />
        <Field
          label="Sottotitolo"
          value={p.subtitle}
          onChange={(v) => setP({ ...p, subtitle: v })}
        />
        <Text
          label="Testo pagina"
          value={p.body}
          onChange={(v) => setP({ ...p, body: v })}
        />
        <Field
          label="Titolo SEO"
          value={p.seoTitle}
          onChange={(v) => setP({ ...p, seoTitle: v })}
        />
        <Field
          label="Descrizione SEO"
          value={p.seoDescription}
          onChange={(v) => setP({ ...p, seoDescription: v })}
        />
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={p.published}
            onChange={(e) => setP({ ...p, published: e.target.checked })}
          />
          Pubblica contenuto
        </label>
        <button className="button-primary" disabled={busy}>
          Salva contenuto
        </button>
      </form>
    </div>
  );
}

function safePrague(v: string, previous: string) {
  try {
    return pragueInstant(v);
  } catch {
    return previous;
  }
}
