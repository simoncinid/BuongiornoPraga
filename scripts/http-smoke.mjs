import assert from "node:assert/strict";
const base = process.env.TEST_URL || "http://localhost:3100";
const pages = [
  "/",
  "/tour",
  "/tour/citta-vecchia-ponte-carlo",
  "/partner-europa",
  "/contatti",
  "/tour-privati",
  "/faq",
  "/privacy",
  "/termini",
  "/checkout",
  "/carrello",
  "/prenotazione/confermata",
  "/accesso",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/llms-full.txt",
  "/ai-context.json",
];
for (const page of pages) {
  const r = await fetch(base + page);
  assert.equal(r.status, 200, page);
  console.log(`200 ${page}`);
}
assert.equal((await fetch(base + "/api/platform/admin/state")).status, 401);
assert.equal((await fetch(base + "/account")).status, 404);
assert.equal((await fetch(base + "/self-service/test")).status, 404);
assert.equal((await fetch(base + "/api/platform/customer/test")).status, 410);
assert.equal(
  (
    await fetch(base + "/api/platform/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
  ).status,
  410,
);
const home = await (await fetch(base + "/")).text();
assert.doesNotMatch(home, /href="\/account"/);

assert.equal((await fetch(base + "/api/admin/bookings")).status, 410);
assert.equal((await fetch(base + "/api/platform/cron")).status, 401);
assert.equal(
  (await fetch(base + "/api/calendar/booking/FTP-UNKNOWN")).status,
  404,
);
const login = await fetch(base + "/api/platform/login", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: base },
  body: JSON.stringify({
    email: "admin@freetourpraga.local",
    password: "PragaLocale!2026",
  }),
});
assert.equal(login.status, 200);
const cookie = login.headers.get("set-cookie").split(";")[0];
const state = await fetch(base + "/api/platform/admin/state", {
  headers: { Cookie: cookie },
});
assert.equal(state.status, 200);
const s = await state.json();
assert.equal(s.role, "admin");
assert.equal(s.orders, undefined);
const bad = await fetch(base + "/api/platform/admin/settings", {
  method: "PUT",
  headers: {
    Cookie: cookie,
    Origin: "https://untrusted.example",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(s.settings),
});
assert.equal(bad.status, 403);
console.log("PASS: protected admin, cron, calendar, login, safe DTO, CSRF");
