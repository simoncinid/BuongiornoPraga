import assert from "node:assert/strict";
import sharp from "sharp";
import { rm } from "node:fs/promises";
const base = process.env.TEST_URL || "http://localhost:3101";
if (!/^http:\/\/(localhost|127\.0\.0\.1):3101$/.test(base))
  throw Error("Solo server QA locale isolato sulla porta 3101");
let cookie = "";
async function call(path, body, method = "POST", extra = {}) {
  console.log(`E2E ${method} ${path}`);
  const r = await fetch(base + path, {
    signal: AbortSignal.timeout(90000),
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: base,
      ...(cookie ? { Cookie: cookie } : {}),
      ...extra,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const d = await r.json();
  assert.equal(r.ok, true, `${path}: ${JSON.stringify(d)}`);
  return d;
}
const login = await fetch(base + "/api/platform/login", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: base },
  body: JSON.stringify({
    email: "admin@freetourpraga.local",
    password: "PragaLocale!2026",
  }),
});
assert.equal(login.status, 200);
cookie = login.headers.get("set-cookie").split(";")[0];
const state = await call("/api/platform/admin/state", undefined, "GET");
assert.equal(state.bookings.length, 0, "QA database must be fresh");
await call(
  "/api/platform/admin/affiliate",
  {
    code: "QAHOTEL",
    name: "QA Hotel",
    email: "qa@example.com",
    type: "hotel",
    commissionPercent: 10,
    active: true,
  },
  "PUT",
);
const qr = await fetch(base + "/api/platform/admin/affiliate/qr?code=QAHOTEL", {
  headers: { Cookie: cookie },
});
assert.equal(qr.status, 200);
assert.match(await qr.text(), /<svg/);
const tours = (await call("/api/platform/catalog", undefined, "GET")).tours;
const input = {
  items: tours.slice(0, 2).map((t) => ({
    tourSlug: t.slug,
    slotId: t.slots.find(
      (s) => new Date(s.startsAt).getTime() > Date.now() + 48 * 3600000,
    ).id,
    adults: 1,
    children: 0,
    infants: 0,
  })),
  name: "QA Cliente",
  email: "qa@example.com",
  phone: "+393331234567",
  notes: "Test isolato",
  paymentMethod: "cash",
  affiliateCode: "QAHOTEL",
  termsAccepted: true,
  whatsappConsent: true,
};
const quote = await call("/api/platform/quote", {
  items: input.items,
  affiliateCode: "QAHOTEL",
});
assert.equal(
  quote.items.reduce((n, x) => n + x.totalCents, 0),
  6120,
);
await call(
  "/api/platform/admin/settings",
  {
    ...state.settings,
    multiTourPercent: 15,
    cancellationHours: 48,
    lateRefundPercent: 25,
  },
  "PUT",
);
const configured = await call("/api/platform/catalog", undefined, "GET");
assert.equal(configured.settings.multiTourPercent, 15);
assert.equal(configured.settings.cancellationHours, 48);
const changedQuote = await call("/api/platform/quote", {
  items: input.items,
  affiliateCode: "QAHOTEL",
});
assert.equal(
  changedQuote.items.reduce((n, x) => n + x.totalCents, 0),
  5780,
);
await call("/api/platform/admin/settings", state.settings, "PUT");
await call(
  "/api/platform/admin/tour",
  { ...state.tours[0], adultMinAge: 16, childMinAge: 6 },
  "PUT",
);
const ageTour = (
  await call("/api/platform/catalog", undefined, "GET")
).tours.find((t) => t.id === state.tours[0].id);
assert.equal(ageTour.adultMinAge, 16);
assert.equal(ageTour.childMinAge, 6);
assert.equal((await fetch(base + "/tour/" + ageTour.slug)).status, 200);
const adminCookie = cookie;
cookie = "";
const key = crypto.randomUUID();
const result = await call("/api/platform/checkout", input, "POST", {
  "Idempotency-Key": key,
});
const duplicate = await call("/api/platform/checkout", input, "POST", {
  "Idempotency-Key": key,
});
assert.equal(result.confirmationUrl, "/prenotazione/confermata");
assert.equal(result.receiptProof, duplicate.receiptProof);
assert.equal(result.manageUrl, undefined);
const token = result.receiptProof;
// No staff cookies are needed for an anonymous, read-only checkout receipt.
let receipt = await call("/api/platform/confirmation", { proof: token });
assert.equal(receipt.bookings.length, 2);
assert.equal(receipt.order.fingerprint, undefined);
assert.equal(receipt.bookings[0].tokenHash, undefined);
assert.equal(receipt.bookings[0].email, undefined);
const b = receipt.bookings[0];
const originalSlot = input.items[0].slotId;
const target = tours[0].slots.find(
  (s) =>
    s.id !== originalSlot &&
    new Date(s.startsAt).getTime() > Date.now() + 48 * 3600000,
);
const ics = await fetch(base + `/api/calendar/booking/${b.pnr}?token=${token}`);
assert.equal(ics.status, 200);
assert.match(await ics.text(), /BEGIN:VCALENDAR/);
for (const path of [
  `/api/platform/customer/${token}`,
  `/api/platform/customer/${token}/cancel`,
  `/api/platform/customer/${token}/move`,
]) {
  console.log(`E2E retired endpoint ${path}`);
  const r = await fetch(base + path, {
    signal: AbortSignal.timeout(90000),
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pnr: b.pnr,
      reason: "unauthorized",
      slotId: target.id,
    }),
  });
  assert.equal(r.status, 410);
}
assert.equal(
  (
    await fetch(base + "/api/platform/admin/booking", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pnr: b.pnr,
        action: "cancel",
        reason: "anonymous",
      }),
    })
  ).status,
  401,
);
cookie = adminCookie;
assert.equal((await fetch(base+"/admin/sito",{headers:{Cookie:cookie}})).status,200);
const managementState = await call(
  "/api/platform/admin/state",
  undefined,
  "GET",
);
const email = managementState.jobs.find(
  (j) => j.type === "email" && j.bookingPnr === b.pnr,
);
const match = email.text.match(
  /\/gestisci-prenotazione\/(FTP-[^/\s]+)\/([A-Za-z0-9_-]{43})/,
);
assert.ok(match);
const managementProof = match[2];
const managementPage = await fetch(base + match[0]);
assert.equal(managementPage.status, 200);
assert.equal(managementPage.headers.get("referrer-policy"), "no-referrer");
cookie = "";
let managed = await call("/api/platform/manage/" + b.pnr, {
  proof: managementProof,
});
assert.equal(managed.pnr, b.pnr);
assert.equal(managed.canMove, true);
const denied = await fetch(
  base + "/api/platform/manage/" + receipt.bookings[1].pnr,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proof: managementProof }),
  },
);
assert.equal(denied.status, 404);
await call("/api/platform/manage/" + b.pnr, {
  proof: managementProof,
  action: "consent",
  consent: false,
});
managed = await call("/api/platform/manage/" + b.pnr, {
  proof: managementProof,
  action: "move",
  slotId: target.id,
});
assert.equal(managed.slotId, target.id);
const managedIcs = await fetch(base + managed.calendarUrl);
assert.equal(managedIcs.status, 200);
assert.match(await managedIcs.text(), /BEGIN:VCALENDAR/);
managed = await call("/api/platform/manage/" + b.pnr, {
  proof: managementProof,
  action: "cancel",
  reason: "Cambio programma",
});
assert.equal(managed.status, "cancelled");
await call("/api/platform/manage/" + b.pnr, {
  proof: managementProof,
  action: "cancel",
  reason: "Ripetizione idempotente",
});
cookie = adminCookie;
const after = (await call("/api/platform/catalog", undefined, "GET")).tours;
assert.equal(after[0].slots.find((s) => s.id === originalSlot).reserved, 0);
assert.equal(after[0].slots.find((s) => s.id === target.id).reserved, 0);
const other = receipt.bookings[1];
await call(
  "/api/platform/admin/booking",
  {
    pnr: other.pnr,
    action: "update",
    adults: 2,
    name: "QA Cliente aggiornato",
    notes: "Partecipanti aggiornati",
  },
  "PATCH",
);
const updated = (
  await call("/api/platform/admin/state", undefined, "GET")
).bookings.find((b) => b.pnr === other.pnr);
assert.equal(updated.totalGuests, 2);
assert.equal(updated.totalCents, 7020);
await call(
  "/api/platform/admin/booking",
  {
    pnr: other.pnr,
    action: "update",
    status: "present",
    paymentStatus: "paid",
    notes: "Incasso test",
  },
  "PATCH",
);
await call("/api/platform/admin/commissions/pay", { code: "QAHOTEL" });
const final = await call("/api/platform/admin/state", undefined, "GET");
assert.equal(
  final.bookings.find((b) => b.pnr === other.pnr).commissionPaid,
  true,
);
await call(
  "/api/platform/admin/page",
  {
    key: "contatti",
    page: {
      title: "Contatti QA verificati",
      subtitle: "QA",
      body: "Testo salvato sul server.",
      seoTitle: "SEO QA",
      seoDescription: "Descrizione SEO QA",
      published: true,
    },
  },
  "PUT",
);
const contact = await (await fetch(base + "/contatti")).text();
assert.match(contact, /Contatti QA verificati/);
assert.match(contact, /SEO QA/);
assert.match(contact, /Invia richiesta/);
if (process.env.HTTP_TEST_PRODUCTION !== "1") {
  const image = await fetch(base + "/api/platform/admin/media", {
    method: "POST",
    headers: { Cookie: cookie, Origin: base, "Content-Type": "image/png" },
    body: await sharp({
      create: { width: 2, height: 2, channels: 3, background: "#1268d6" },
    })
      .png()
      .toBuffer(),
  });
  const media = await image.json();
  assert.equal(image.status, 200, JSON.stringify(media));
  assert.match(media.url, /^\/api\/media\/[-a-f0-9]{36}\.webp$/);
  const downloaded = await fetch(base + media.url);
  assert.equal(downloaded.status, 200);
  assert.equal(downloaded.headers.get("content-type"), "image/webp");
  await rm(`.data/media/${media.url.split("/").pop()}`);
}
const cms = (await call("/api/platform/admin/state", undefined, "GET"))
  .siteContent;
cms.globals.footerText = "Footer pubblicato dal gestionale QA";
cms.globals.email = "assistenza-qa@example.com";
cms.home.trustTitle = "Titolo fiducia modificato QA";
cms.faqs = [{ q: "Domanda QA pubblicata?", a: "Risposta QA dal backend." }];
cms.gallery[0].title = "Foto QA dal gestionale";
await call("/api/platform/admin/site-content", cms, "PUT");
const home = await (await fetch(base + "/")).text();
assert.match(home, /Footer pubblicato dal gestionale QA/);
assert.match(home, /Titolo fiducia modificato QA/);
assert.match(home, /Domanda QA pubblicata/);
assert.match(home, /Foto QA dal gestionale/);
assert.match(home, /assistenza-qa@example.com/);
const faq = await (await fetch(base + "/faq")).text();
assert.match(faq, /Risposta QA dal backend/);
const ai = await (await fetch(base + "/ai-context.json")).json();
assert.equal(ai.faq[0].a, "Risposta QA dal backend.");
if(process.env.HTTP_TEST_PRODUCTION==='1'){
 assert.doesNotMatch(home,/fonts\.googleapis\.com/);
 const styles=[...home.matchAll(/href="([^" ]+\.css[^" ]*)"/g)].map(m=>m[1]);assert.ok(styles.length);
 let fontFiles=[];for(const style of styles){const r=await fetch(new URL(style,base));assert.equal(r.status,200);const css=await r.text();fontFiles.push(...[...css.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)].map(m=>new URL(m[1],new URL(style,base)).toString()));}
 assert.ok(fontFiles.length,'Bundled fonts must be present');for(const url of [...new Set(fontFiles)].slice(0,2)){const r=await fetch(url);assert.equal(r.status,200);assert.ok((await r.arrayBuffer()).byteLength>1000);}
}
const operatorLogin = await fetch(base + "/api/platform/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "operator@freetourpraga.local",
    password: "PragaLocale!2026",
  }),
});
assert.equal(operatorLogin.status, 200);
const operatorCookie = operatorLogin.headers.get("set-cookie").split(";")[0];
const forbiddenPublish = await fetch(
  base + "/api/platform/admin/site-content",
  {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: operatorCookie },
    body: JSON.stringify(cms),
  },
);
assert.equal(forbiddenPublish.status, 403);
const badContent = await fetch(base + "/api/platform/admin/site-content", {
  method: "PUT",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({
    ...cms,
    globals: {
      ...cms.globals,
      socialLinks: [{ label: "Unsafe", url: "javascript:alert(1)" }],
    },
  }),
});
assert.equal(badContent.status, 400);
await call(
  "/api/platform/admin/booking",
  { pnr: other.pnr, action: "cancel", reason: "Rimborso contanti QA" },
  "PATCH",
);
await call(
  "/api/platform/admin/booking",
  { pnr: other.pnr, action: "refund-record", confirmRefund: true },
  "PATCH",
);
const refunded = (
  await call("/api/platform/admin/state", undefined, "GET")
).bookings.find((b) => b.pnr === other.pnr);
assert.equal(refunded.paymentStatus, "refunded");
const csv = await fetch(base + "/api/platform/admin/export", {
  headers: { Cookie: cookie },
});
assert.equal(csv.status, 200);
assert.match(await csv.text(), /QA Cliente/);
console.log(
  "PASS E2E: anonymous checkout, read-only receipt, no customer account, scoped booking self-service, staff operations, configurable pricing/policy/ages, affiliate/QR, calendar, commissions, CMS globals/home/FAQ/gallery/SEO, image upload, CSV. No external delivery performed.",
);
