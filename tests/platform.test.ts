import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  transaction,
  readState,
  initialState,
  database,
} from "../src/lib/platform/store";
import {
  createOrder,
  cancelReservation,
  moveReservation,
  orderConfirmation,
  quote,
  releaseExpired,
} from "../src/lib/platform/booking";
import { checkoutSchema, tourSchema } from "../src/lib/platform/validation";
import { ingestOta } from "../src/lib/platform/ota";
let temp: string;
before(async () => {
  if (process.env.TEST_POSTGRES === "1") {
    assert.match(process.env.DATABASE_URL || "", /\/ftp_test_[a-z0-9_]+/);
    process.env.PLATFORM_STORAGE = "postgres";
  } else {
    temp = await mkdtemp(join(tmpdir(), "ftp-test-"));
    process.env.PLATFORM_STORAGE = "local";
    process.env.PLATFORM_DATA_FILE = join(temp, "state.json");
  }
  await transaction((s) => {
    Object.assign(s, initialState());
    for (const t of s.tours)
      for (const slot of t.slots) {
        slot.startsAt = new Date(Date.now() + 7 * 86400000).toISOString();
        slot.endsAt = new Date(
          Date.now() + 7 * 86400000 + 7200000,
        ).toISOString();
        slot.reserved = 0;
      }
  });
});
after(async () => {
  if (temp) await rm(temp, { recursive: true, force: true });
  else await database().$disconnect();
});
function input(slotId = "old-town-1", tourSlug = "citta-vecchia-ponte-carlo") {
  return checkoutSchema.parse({
    items: [{ tourSlug, slotId, adults: 1 }],
    name: "Test Cliente",
    email: "cliente@example.com",
    phone: "+393331234567",
    paymentMethod: "cash",
    termsAccepted: true,
    whatsappConsent: true,
  });
}
test("validation rejects negative or fractional participants and missing consent", () => {
  assert.throws(() =>
    checkoutSchema.parse({
      ...input(),
      items: [{ ...input().items[0], adults: -1 }],
    }),
  );
  assert.throws(() =>
    checkoutSchema.parse({
      ...input(),
      items: [{ ...input().items[0], adults: 1.5 }],
    }),
  );
  assert.throws(() =>
    checkoutSchema.parse({ ...input(), termsAccepted: false }),
  );
});
test("server recalculates multi-tour discount; client amounts cannot change it", async () => {
  const s = await readState();
  const i = {
    ...input(),
    items: [
      input().items[0],
      input("castle-1", "castello-praga-mala-strana").items[0],
    ],
  };
  const q = quote(s, i);
  assert.equal(
    q.reduce((n, x) => n + x.totalCents, 0),
    6120,
  );
});
test("concurrent requests cannot oversell inventory", async () => {
  await transaction((s) => {
    s.tours[0].slots[0].capacity = 5;
  });
  const results = await Promise.allSettled(
    Array.from({ length: 12 }, () => createOrder(input(), randomUUID())),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 5);
  const s = await readState();
  assert.equal(s.tours[0].slots[0].reserved, 5);
  assert.equal(s.bookings.filter((b) => b.slotId === "old-town-1").length, 5);
});
test("idempotency prevents duplicate bookings and rejects changed payload", async () => {
  const key = randomUUID();
  const one = await createOrder(input("old-town-2"), key);
  const two = await createOrder(input("old-town-2"), key);
  assert.equal(one.id, two.id);
  await assert.rejects(() =>
    createOrder({ ...input("old-town-2"), name: "Altra Persona" }, key),
  );
});
test("cancellation requires authorization and releases seats once", async () => {
  const o = await createOrder(input("old-town-2"), randomUUID());
  const before = (await readState()).tours[0].slots[1].reserved;
  await assert.rejects(() => cancelReservation(o.pnrs[0], "Test", ""));
  await cancelReservation(o.pnrs[0], "Cambio programma", "qa-staff");
  await cancelReservation(o.pnrs[0], "Di nuovo", "qa-staff");
  assert.equal((await readState()).tours[0].slots[1].reserved, before - 1);
});
test("move is atomic and handles full target without releasing original", async () => {
  const o = await createOrder(input("old-town-2"), randomUUID());
  await assert.rejects(() =>
    moveReservation(o.pnrs[0], "old-town-1", "qa-staff"),
  );
  assert.equal(
    (await readState()).bookings.find((b) => b.orderId === o.id)!.slotId,
    "old-town-2",
  );
  await moveReservation(o.pnrs[0], "old-town-3", "qa-staff");
  assert.equal(
    (await readState()).bookings.find((b) => b.orderId === o.id)!.slotId,
    "old-town-3",
  );
});
test("OTA duplicate email imports once, unknown layouts require review", async () => {
  const raw =
    "CUSTOMER: Mario Test\nEMAIL: ota@example.com\nPHONE: +393331234567\nTOUR_SLUG: castello-praga-mala-strana\nSLOT_ID: castle-1\nADULTS: 2";
  const a = await ingestOta({
    provider: "civitatis",
    reference: "CV-123",
    raw,
  });
  const b = await ingestOta({
    provider: "civitatis",
    reference: "CV-123",
    raw,
  });
  assert.equal(a.pnr, b.pnr);
  assert.equal(
    (await readState()).bookings.filter((x) => x.source === "civitatis").length,
    1,
  );
  const unknown = await ingestOta({
    provider: "getyourguide",
    reference: "GYG-456",
    raw: "Unknown email format to be reviewed",
  });
  assert.equal(unknown.status, "review");
});
test("commission recorded server side and removed on cancellation", async () => {
  await transaction((s) =>
    s.affiliates.push({
      code: "HOTELTEST",
      name: "Hotel Test",
      email: "hotel@example.com",
      type: "hotel",
      commissionPercent: 10,
      active: true,
    }),
  );
  const o = await createOrder(
    { ...input("old-town-4"), affiliateCode: "HOTELTEST" },
    randomUUID(),
  );
  const b = (await readState()).bookings.find((b) => b.orderId === o.id)!;
  assert.equal(b.commissionCents, 290);
  await cancelReservation(b.pnr, "Test", "qa-staff");
  assert.equal(
    (await readState()).bookings.find((b) => b.orderId === o.id)!
      .commissionCents,
    0,
  );
});
test("unpaid hold expiry releases inventory", async () => {
  await transaction((s) => {
    const o = s.orders[0];
    const b = s.bookings.find((b) => b.orderId === o.id)!;
    b.status = "pending";
    b.paymentStatus = "pending";
    o.expiresAt = new Date(0).toISOString();
    const before = s.tours[0].slots[0].reserved;
    releaseExpired(s);
    assert.equal(s.tours[0].slots[0].reserved, before - 1);
  });
});
test("catalog validation preserves required operational fields", async () => {
  const s = await readState();
  assert.equal(tourSchema.parse(s.tours[0]).slug, s.tours[0].slug);
  assert.throws(() =>
    tourSchema.parse({ ...s.tours[0], imageUrl: "https://evil.example/a.jpg" }),
  );
});

test("native labeled OTA email maps aliases, Prague dates and reference safely", async () => {
  const s = await readState();
  const t = s.tours[1];
  const date = new Date(t.slots[1].startsAt).toLocaleDateString("sv-SE", {
    timeZone: "Europe/Prague",
  });
  const hour = new Date(t.slots[1].startsAt).toLocaleTimeString("it-IT", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    minute: "2-digit",
  });
  const { parseOta, providerReference } =
    await import("../src/lib/platform/ota");
  const raw = `Booking reference: GYG-REAL-LAYOUT\nActivity: ${t.title}\nCustomer name: Maria Test\nEmail: maria@example.com\nPhone: +393331234567\nDate: ${date}\nTime: ${hour}\nAdults: 2\nChildren: 1`;
  const parsed = parseOta(raw, s);
  assert.equal(parsed.items[0].slotId, t.slots[0].id);
  assert.equal(providerReference(raw), "GYG-REAL-LAYOUT");
});
test("Stripe signature, idempotency and amounts are verified before fulfillment", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  const { stripeWebhook, stripe } =
    await import("../src/lib/platform/providers");
  const o = await createOrder(
    input("beer-1", "birra-ceca-storie-locali"),
    randomUUID(),
  );
  await transaction((s) => {
    const row = s.orders.find((x) => x.id === o.id)!;
    row.stripeSessionId = "cs_test_valid";
    const b = s.bookings.find((b) => b.orderId === o.id)!;
    b.status = "pending";
    b.paymentStatus = "pending";
    b.paymentMethod = "stripe";
  });
  const payload = JSON.stringify({
    id: "evt_test_paid",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_valid",
        metadata: { orderId: o.id },
        amount_total: o.totalCents,
        currency: "eur",
        payment_status: "paid",
        payment_intent: "pi_test_valid",
      },
    },
  });
  const signature = stripe().webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  await assert.rejects(() => stripeWebhook(payload, "invalid"));
  await stripeWebhook(payload, signature);
  await stripeWebhook(payload, signature);
  const s = await readState();
  assert.equal(
    s.bookings.find((b) => b.orderId === o.id)!.paymentStatus,
    "paid",
  );
  assert.equal(s.events.filter((x) => x === "evt_test_paid").length, 1);
});
test("refund is queued with cancellation policy and not marked completed early", async () => {
  const s = await readState();
  const b = s.bookings.find(
    (b) => b.paymentMethod === "stripe" && b.paymentStatus === "paid",
  )!;
  const o = s.orders.find((o) => o.id === b.orderId)!;
  await cancelReservation(b.pnr, "Rimborso test", "qa-staff");
  const latest = await readState();
  const cancelled = latest.bookings.find((x) => x.pnr === b.pnr)!;
  assert.equal(cancelled.refundCents, b.totalCents);
  assert.equal(cancelled.refundStatus, "queued");
  assert.equal(cancelled.paymentStatus, "paid");
  assert.equal(
    latest.jobs.filter((j) => j.key === `refund:${b.pnr}`).length,
    1,
  );
});
test("Prague wall times roundtrip across winter and summer; DST gap rejected", async () => {
  const { pragueInstant, pragueLocal } =
    await import("../src/lib/platform/time");
  assert.equal(pragueInstant("2026-12-01T10:00"), "2026-12-01T09:00:00.000Z");
  assert.equal(pragueInstant("2026-07-01T10:00"), "2026-07-01T08:00:00.000Z");
  assert.equal(pragueLocal("2026-12-01T09:00:00.000Z"), "2026-12-01T10:00");
  assert.throws(() => pragueInstant("2026-03-29T02:30"));
});

test("missing providers keep jobs retryable, never report a simulated delivery", async () => {
  delete process.env.SMTP_HOST;
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.STRIPE_SECRET_KEY;
  const { runJobs } = await import("../src/lib/platform/providers");
  await runJobs();
  const s = await readState();
  assert.ok(
    s.jobs.some(
      (j) => j.type === "email" && j.attempts > 0 && j.status === "queued",
    ),
  );
  assert.equal(
    s.jobs.filter((j) => j.type === "email" && j.status === "sent").length,
    0,
  );
});
test("personal data retention removes tokens and queued customer content", async () => {
  const { maintainPrivacy } = await import("../src/lib/platform/maintenance");
  await transaction((s) => {
    const b = s.bookings[0];
    const t = s.tours.find((t) => t.slug === b.tourSlug)!;
    const slot = t.slots.find((x) => x.id === b.slotId)!;
    slot.startsAt = new Date(Date.now() - 800 * 86400000).toISOString();
  });
  const result = await maintainPrivacy();
  assert.ok(result.cleaned > 0);
  const s = await readState();
  assert.equal(s.bookings[0].name, "Dati rimossi");
  assert.equal(s.bookings[0].tokenHash, "");
});

test("OTA follow-up messages require review and never create a second reservation", async () => {
  const before = (await readState()).bookings.length;
  const m = await ingestOta({
    provider: "civitatis",
    reference: "CV-123",
    raw: "Booking status: Cancelled\nBooking reference: CV-123\nNew message from provider",
  });
  assert.equal(m.status, "review");
  assert.ok("pnr" in m && m.pnr);
  assert.equal((await readState()).bookings.length, before);
});
test("DKIM pass must align with the allowlisted sender domain", async () => {
  const { verifiedDkim } = await import("../src/lib/platform/ota");
  assert.equal(
    verifiedDkim(
      "mx.example; dkim=pass header.d=civitatis.com; dmarc=pass",
      "booking@civitatis.com",
    ),
    true,
  );
  assert.equal(
    verifiedDkim(
      "mx.example; dkim=pass header.i=@getyourguide.com",
      "booking@getyourguide.com",
    ),
    true,
  );
  assert.equal(
    verifiedDkim(
      "mx.example; dkim=pass header.d=attacker.example",
      "booking@civitatis.com",
    ),
    false,
  );
  assert.equal(
    verifiedDkim(
      "mx.example; dkim=fail header.d=civitatis.com",
      "booking@civitatis.com",
    ),
    false,
  );
});

test("commercial rules are read from persisted backend settings and frozen on bookings", async () => {
  await transaction((s) => {
    s.settings.multiTourPercent = 15;
    s.settings.cancellationHours = 48;
    s.settings.lateRefundPercent = 25;
    const slot = s.tours
      .find((t) => t.id === "beer")!
      .slots.find((x) => x.id === "beer-2")!;
    slot.startsAt = new Date(Date.now() + 36 * 3600000).toISOString();
    slot.endsAt = new Date(Date.now() + 38 * 3600000).toISOString();
  });
  const s = await readState();
  const items = [
    input("castle-2", "castello-praga-mala-strana").items[0],
    input("beer-2", "birra-ceca-storie-locali").items[0],
  ];
  assert.equal(
    quote(s, { items, affiliateCode: "" }).reduce(
      (n, x) => n + x.totalCents,
      0,
    ),
    6205,
  );
  const o = await createOrder(
    input("beer-2", "birra-ceca-storie-locali"),
    randomUUID(),
  );
  await transaction((s) => {
    const b = s.bookings.find((b) => b.orderId === o.id)!;
    b.paymentMethod = "stripe";
    b.paymentStatus = "paid";
    s.settings.cancellationHours = 0;
    s.settings.lateRefundPercent = 100;
  });
  await cancelReservation(o.pnrs[0], "Policy test", "qa-staff");
  const b = (await readState()).bookings.find((b) => b.orderId === o.id)!;
  assert.equal(b.refundCents, 850);
  assert.equal(b.policy!.cancellationHours, 48);
});
test("cart persists in localStorage of the same browser and is isolated from another browser", async () => {
  const { addToCart, getCartItems, clearCart } =
    await import("../src/lib/cart");
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  const browser = () => {
    const data = new Map<string, string>();
    return {
      localStorage: {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => data.set(k, v),
      },
      dispatchEvent: () => true,
    };
  };
  const first = browser(),
    second = browser();
  const select = (value: unknown) =>
    Object.defineProperty(globalThis, "window", { configurable: true, value });
  try {
    select(first);
    addToCart({
      tourSlug: "example",
      tourTitle: "Tour",
      slotId: "slot",
      startsAt: new Date().toISOString(),
      adults: 1,
      children: 0,
      unitAdultCents: 2900,
      unitChildCents: 1600,
    });
    assert.equal(getCartItems().length, 1);
    select(second);
    assert.deepEqual(getCartItems(), []);
    select(first);
    assert.equal(getCartItems()[0].slotId, "slot");
    clearCart();
    assert.deepEqual(getCartItems(), []);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("email management proof is restricted to one booking and protects inventory mutations", async () => {
  const { bookingManagementProof } =
    await import("../src/lib/platform/security");
  const { managedBooking } = await import("../src/lib/platform/booking");
  await transaction((s) => {
    s.settings.cancellationHours = 24;
  });
  const o = await createOrder(
    {
      ...input("castle-3", "castello-praga-mala-strana"),
      items: [
        input("castle-3", "castello-praga-mala-strana").items[0],
        input("beer-3", "birra-ceca-storie-locali").items[0],
      ],
    },
    randomUUID(),
  );
  const s = await readState();
  const first = s.bookings.find((b) => b.pnr === o.pnrs[0])!,
    second = s.bookings.find((b) => b.pnr === o.pnrs[1])!;
  const proof = bookingManagementProof(first.id, first.pnr);
  assert.equal((await managedBooking(first.pnr, proof)).pnr, first.pnr);
  await assert.rejects(() => managedBooking(second.pnr, proof));
  await assert.rejects(() =>
    cancelReservation(second.pnr, "Test", "customer-link", proof),
  );
  await moveReservation(first.pnr, "castle-2", "customer-link", proof);
  assert.equal((await managedBooking(first.pnr, proof)).slotId, "castle-2");
  await cancelReservation(
    first.pnr,
    "Cambio programma",
    "customer-link",
    proof,
  );
  assert.equal((await managedBooking(first.pnr, proof)).status, "cancelled");
});
test("self-service move deadline is enforced inside the booking transaction", async () => {
  const { bookingManagementProof } =
    await import("../src/lib/platform/security");
  const { managedBooking } = await import("../src/lib/platform/booking");
  const o = await createOrder(input("old-town-4"), randomUUID());
  await transaction((s) => {
    const b = s.bookings.find((b) => b.orderId === o.id)!;
    b.policy = { cancellationHours: 48, lateRefundPercent: 0 };
    const { slot } = s.tours
      .flatMap((t) => t.slots.map((slot) => ({ slot })))
      .find((x) => x.slot.id === b.slotId)!;
    slot.startsAt = new Date(Date.now() + 12 * 3600000).toISOString();
  });
  const b = (await readState()).bookings.find((b) => b.orderId === o.id)!;
  const proof = bookingManagementProof(b.id, b.pnr);
  assert.equal((await managedBooking(b.pnr, proof)).canMove, false);
  await assert.rejects(() =>
    moveReservation(b.pnr, "old-town-2", "customer-link", proof),
  );
});
test("public content schema rejects unsafe links and retains editable marketing fields", async () => {
  const { defaultSiteContent } = await import("../src/lib/platform/content");
  const { siteContentSchema } =
    await import("../src/lib/platform/content-validation");
  const c = defaultSiteContent();
  c.home.trustTitle = "Testo aggiornato";
  assert.equal(siteContentSchema.parse(c).home.trustTitle, "Testo aggiornato");
  assert.throws(() =>
    siteContentSchema.parse({
      ...c,
      globals: {
        ...c.globals,
        socialLinks: [{ label: "Unsafe", url: "javascript:alert(1)" }],
      },
    }),
  );
});

test("cash refunds are handed to staff rather than sent to Stripe", async () => {
  const o = await createOrder(input("old-town-3"), randomUUID());
  await transaction((s) => {
    const b = s.bookings.find((b) => b.orderId === o.id)!;
    b.paymentStatus = "paid";
    b.policy = { cancellationHours: 0, lateRefundPercent: 100 };
  });
  await cancelReservation(o.pnrs[0], "Rimborso contanti", "qa-staff");
  const s = await readState();
  const b = s.bookings.find((b) => b.orderId === o.id)!;
  assert.equal(b.refundStatus, "manual");
  assert.equal(
    s.jobs.filter((j) => j.type === "refund" && j.bookingPnr === b.pnr).length,
    0,
  );
});
