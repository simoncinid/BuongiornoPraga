// Store UTC instants; edit and display wall times in Europe/Prague.
export function pragueLocal(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(" ", "T");
}
export function pragueInstant(local: string) {
  const desired = Date.parse(`${local}:00Z`);
  if (!Number.isFinite(desired)) throw new Error("Data non valida");
  let at = desired;
  for (let i = 0; i < 3; i++) {
    const shown = Date.parse(`${pragueLocal(new Date(at).toISOString())}:00Z`);
    at += desired - shown;
  }
  if (pragueLocal(new Date(at).toISOString()) !== local)
    throw new Error("Orario non valido per il cambio di ora legale");
  return new Date(at).toISOString();
}
