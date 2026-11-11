import { randomUUID } from "node:crypto";
import { z } from "zod";
import { checkoutSchema } from "./validation";
import { audit, readState, transaction } from "./store";
import {
  hash,
  HttpError,
  secretToken,
  bookingManagementProof,
  verifyBookingManagementProof,
} from "./security";
import type { Job, Order, PlatformState, Reservation } from "./model";
import { siteContent } from "./content";
import { site } from "../site";
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export function enqueue(
  s: PlatformState,
  job: Omit<Job, "id" | "status" | "attempts">,
) {
  if (!s.jobs.some((j) => j.key === job.key))
    s.jobs.push({ ...job, id: randomUUID(), status: "queued", attempts: 0 });
}
export function getReservation(s: PlatformState, pnr: string, token: string) {
  const b = s.bookings.find((b) => b.pnr === pnr);
  if (
    !b ||
    !token ||
    b.tokenHash !== hash(token) ||
    new Date(b.expiresAt).getTime() < Date.now()
  )
    throw new HttpError(404, "Prenotazione non trovata o link scaduto");
  return b;
}
export function slotFor(
  s: PlatformState,
  b: Pick<Reservation, "tourSlug" | "slotId">,
) {
  const tour = s.tours.find((t) => t.slug === b.tourSlug);
  const slot = tour?.slots.find((x) => x.id === b.slotId);
  if (!tour || !slot) throw new HttpError(404, "Partenza non disponibile");
  return { tour, slot };
}
export function notification(s: PlatformState, b: Reservation, kind: string) {
  const { tour, slot } = slotFor(s, b);
  const contact = siteContent(s.siteContent).globals;
  const order = s.orders.find((o) => o.id === b.orderId)!;
  const text = [
    `Prenotazione ${b.pnr}: ${kind}`,
    `Ciao ${b.name},`,
    tour.title,
    new Date(slot.startsAt).toLocaleString("it-IT", {
      timeZone: "Europe/Prague",
    }),
    `${b.totalGuests} partecipanti · EUR ${(b.totalCents / 100).toFixed(2)}`,
    `Punto d'incontro: ${tour.meetingPoint}, ${tour.meetingAddress}`,
    tour.mapUrl,
    b.paymentMethod === "stripe"
      ? `Pagamento dell’ordine complessivo (${order.pnrs.length} tour, EUR ${(order.totalCents / 100).toFixed(2)}): ${order.paymentUrl || "link in preparazione"}`
      : b.paymentMethod === "ota"
        ? "Pagamento gestito dal provider esterno."
        : "Pagamento in contanti sul posto.",
    `Gestisci questa prenotazione: ${site.url}/gestisci-prenotazione/${b.pnr}/${bookingManagementProof(b.id, b.pnr)}`,
    `Assistenza: ${contact.email} · riferimento ${b.pnr}.`,
    `Calendario: ${site.url}/api/calendar/booking/${b.pnr}?manage=${bookingManagementProof(b.id, b.pnr)}`,
    s.settings.emailFooter,
  ].join("\n");
  enqueue(s, {
    key: `email:${b.pnr}:${kind}:${randomUUID()}`,
    type: "email",
    bookingPnr: b.pnr,
    to: b.email,
    subject: `${kind} · ${b.pnr} · ${contact.brandName}`,
    text,
    runAt: new Date().toISOString(),
  });
  for (const j of s.jobs)
    if (
      j.type === "whatsapp" &&
      j.bookingPnr === b.pnr &&
      j.status === "queued"
    )
      j.status = "failed";
  if (b.whatsappConsent && b.status !== "cancelled") {
    const at = new Date(
      new Date(slot.startsAt).getTime() - s.settings.reminderHours * 3600000,
    );
    if (new Date(slot.startsAt).getTime() > Date.now())
      enqueue(s, {
        key: `wa:${b.pnr}:${b.slotId}:${randomUUID()}`,
        type: "whatsapp",
        bookingPnr: b.pnr,
        to: b.phone,
        text,
        runAt: at.toISOString(),
      });
  }
}
export function releaseExpired(s: PlatformState) {
  for (const o of s.orders) {
    if (new Date(o.expiresAt).getTime() > Date.now()) continue;
    for (const b of s.bookings.filter(
      (b) =>
        b.orderId === o.id &&
        b.status === "pending" &&
        b.paymentStatus !== "paid",
    )) {
      const { slot } = slotFor(s, b);
      slot.reserved -= b.totalGuests;
      b.status = "cancelled";
      b.cancellationReason = "Pagamento non completato entro 30 minuti";
      for (const j of s.jobs)
        if (j.bookingPnr === b.pnr && j.status === "queued")
          j.status = "failed";
    }
  }
}
export function quote(
  s: PlatformState,
  input: Pick<CheckoutInput, "items" | "affiliateCode">,
) {
  const discount =
    new Set(input.items.map((x) => x.tourSlug)).size >= s.settings.minimumTours
      ? s.settings.multiTourPercent
      : 0;
  if (
    input.affiliateCode &&
    !s.affiliates.some((a) => a.code === input.affiliateCode && a.active)
  )
    throw new HttpError(400, "Codice affiliato non valido");
  return input.items.map((item) => {
    const { tour, slot } = slotFor(s, item);
    if (
      !tour.published ||
      new Date(slot.startsAt).getTime() <
        Date.now() + tour.bookingCutoffHours * 3600000
    )
      throw new HttpError(409, "Partenza chiusa alle prenotazioni");
    if (tour.childMinAge === 0 && item.infants > 0)
      throw new HttpError(
        400,
        "Per questo tour i più piccoli rientrano nella fascia bambini",
      );
    const guests = item.adults + item.children + item.infants;
    if (guests > slot.capacity - slot.reserved)
      throw new HttpError(409, `Posti insufficienti per ${tour.title}`);
    const subtotalCents =
      item.adults * tour.basePriceCents +
      item.children * tour.childPriceCents +
      item.infants * tour.infantPriceCents;
    const discountCents = Math.round((subtotalCents * discount) / 100);
    return {
      ...item,
      subtotalCents,
      discountCents,
      totalCents: subtotalCents - discountCents,
      totalGuests: guests,
    };
  });
}
export async function createOrder(
  input: CheckoutInput,
  key: string,
  source = "site",
) {
  if (input.paymentMethod === "stripe" && !process.env.STRIPE_SECRET_KEY)
    throw new HttpError(
      503,
      "Pagamento online non ancora configurato. Scegli contanti sul posto.",
    );
  return transaction((s) => {
    releaseExpired(s);
    const fingerprint = hash(JSON.stringify(input));
    const previous = s.orders.find((o) => o.key === key);
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw new HttpError(409, "Chiave richiesta già utilizzata");
      return { ...previous };
    }
    if (new Set(input.items.map((x) => x.slotId)).size !== input.items.length)
      throw new HttpError(
        400,
        "Unisci i partecipanti della stessa partenza in una sola voce",
      );
    const prices = quote(s, input);
    const token = secretToken();
    const now = new Date().toISOString();
    const order: Order = {
      id: randomUUID(),
      key,
      fingerprint,
      pnrs: [],
      token,
      totalCents: prices.reduce((n, x) => n + x.totalCents, 0),
      createdAt: now,
      expiresAt: new Date(Date.now() + 31 * 60000).toISOString(),
    };
    s.orders.push(order);
    const affiliate = s.affiliates.find(
      (a) => a.code === input.affiliateCode && a.active,
    );
    for (const item of prices) {
      const { slot } = slotFor(s, item);
      slot.reserved += item.totalGuests;
      const b: Reservation = {
        ...item,
        id: randomUUID(),
        pnr: `FTP-${secretToken().slice(0, 10).toUpperCase()}`,
        orderId: order.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        paymentMethod: input.paymentMethod,
        paymentStatus:
          input.paymentMethod === "cash" ? "not_required" : "pending",
        status: input.paymentMethod === "cash" ? "confirmed" : "pending",
        source,
        affiliateCode: affiliate?.code || "",
        commissionCents: Math.round(
          (item.totalCents * (affiliate?.commissionPercent || 0)) / 100,
        ),
        commissionPaid: false,
        tokenHash: hash(token),
        expiresAt: new Date(
          new Date(slot.startsAt).getTime() + 30 * 86400000,
        ).toISOString(),
        createdAt: now,
        whatsappConsent: input.whatsappConsent,
        consentAt: now,
        policy: {
          cancellationHours: s.settings.cancellationHours,
          lateRefundPercent: s.settings.lateRefundPercent,
        },
        unitAdultCents: slotFor(s, item).tour.basePriceCents,
        unitChildCents: slotFor(s, item).tour.childPriceCents,
        unitInfantCents: slotFor(s, item).tour.infantPriceCents,
        termsVersion: `2026-11-06:${hash(JSON.stringify({ terms: s.pages.termini || null, cancellationHours: s.settings.cancellationHours, lateRefundPercent: s.settings.lateRefundPercent })).slice(0, 16)}`,
      };
      s.bookings.push(b);
      order.pnrs.push(b.pnr);
      if (
        input.paymentMethod === "cash" &&
        !["civitatis", "getyourguide"].includes(source)
      )
        notification(s, b, "Confermata");
    }
    audit(s, source, "booking.create", order.id);
    return { ...order };
  });
}
export async function cancelReservation(
  pnr: string,
  reason: string,
  actor: string,
  proof?: string,
) {
  return transaction((s) => {
    if (!actor) throw new HttpError(401, "Operatore autorizzato richiesto");
    const b = s.bookings.find((x) => x.pnr === pnr);
    if (!b) throw new HttpError(404, "Prenotazione non trovata");
    if (proof !== undefined) requireBookingManagement(s, pnr, proof);
    if (b.status === "cancelled") return b;
    if (
      proof !== undefined &&
      new Date(slotFor(s, b).slot.startsAt).getTime() <= Date.now()
    )
      throw new HttpError(409, "Il tour è già iniziato: contatta lo staff.");
    const { slot } = slotFor(s, b);
    const free =
      new Date(slot.startsAt).getTime() - Date.now() >=
      (b.policy?.cancellationHours ?? s.settings.cancellationHours) * 3600000;
    b.refundCents =
      b.paymentStatus === "paid"
        ? Math.round(
            b.totalCents *
              (free
                ? 1
                : (b.policy?.lateRefundPercent ??
                    s.settings.lateRefundPercent) / 100),
          )
        : 0;
    slot.reserved -= b.totalGuests;
    b.status = "cancelled";
    b.cancellationReason = reason;
    b.commissionCents = 0;
    if (b.refundCents) {
      b.refundStatus = b.paymentMethod !== "stripe" ? "manual" : "queued";
      if (b.paymentMethod !== "stripe")
        enqueue(s, {
          key: `manual-refund:${b.pnr}`,
          type: "email",
          to:
            process.env.ADMIN_EMAIL || siteContent(s.siteContent).globals.email,
          subject: `Rimborso ${b.paymentMethod === "ota" ? "OTA" : "contanti"} da gestire: ${b.pnr}`,
          text: `Gestire ${b.paymentMethod === "ota" ? "sul provider " + b.source : "manualmente per il pagamento in contanti"} il rimborso di EUR ${(b.refundCents / 100).toFixed(2)} per ${b.pnr}.`,
          runAt: new Date().toISOString(),
        });
      else
        enqueue(s, {
          key: `refund:${b.pnr}`,
          type: "refund",
          orderId: b.orderId,
          bookingPnr: b.pnr,
          amount: b.refundCents,
          runAt: new Date().toISOString(),
        });
    }
    notification(s, b, "Cancellata");
    audit(s, actor, "booking.cancel", b.pnr);
    return b;
  });
}
export async function moveReservation(
  pnr: string,
  slotId: string,
  actor: string,
  proof?: string,
) {
  return transaction((s) => {
    if (!actor) throw new HttpError(401, "Operatore autorizzato richiesto");
    const b = s.bookings.find((x) => x.pnr === pnr);
    if (!b) throw new HttpError(404, "Prenotazione non trovata");
    if (proof !== undefined) requireBookingManagement(s, pnr, proof);
    if (b.status !== "confirmed")
      throw new HttpError(409, "La prenotazione non è modificabile");
    const { tour, slot: old } = slotFor(s, b);
    if (
      proof !== undefined &&
      (!tour.published ||
        new Date(old.startsAt).getTime() - Date.now() <
          (b.policy?.cancellationHours ?? s.settings.cancellationHours) *
            3600000)
    )
      throw new HttpError(
        409,
        "Il termine per cambiare partenza è scaduto: contatta lo staff.",
      );
    const next = tour.slots.find((x) => x.id === slotId);
    if (
      !next ||
      new Date(next.startsAt).getTime() <
        Date.now() + tour.bookingCutoffHours * 3600000
    )
      throw new HttpError(409, "Partenza non disponibile");
    if (next.id === old.id) return b;
    if (next.capacity - next.reserved < b.totalGuests)
      throw new HttpError(409, "Posti insufficienti");
    old.reserved -= b.totalGuests;
    next.reserved += b.totalGuests;
    b.slotId = next.id;
    b.expiresAt = new Date(
      new Date(next.startsAt).getTime() + 30 * 86400000,
    ).toISOString();
    notification(s, b, "Modificata");
    audit(s, actor, "booking.move", b.pnr);
    return b;
  });
}
// Anonymous checkout receipt: read-only, proof stays in this browser tab.
// No customer account, recovery link or booking management endpoint.
export async function orderConfirmation(proof: string) {
  if (!proof || proof.length > 200)
    throw new HttpError(404, "Conferma non disponibile");
  const s = await readState();
  const o = s.orders.find((o) => o.token && hash(o.token) === hash(proof));
  if (!o || Date.now() - new Date(o.createdAt).getTime() > 24 * 3600000)
    throw new HttpError(404, "Consulta la conferma ricevuta via email");
  return {
    order: {
      id: o.id,
      pnrs: o.pnrs,
      totalCents: o.totalCents,
      paymentUrl: o.paymentUrl,
    },
    bookings: o.pnrs.map((p) => {
      const b = getReservation(s, p, proof);
      const { tour, slot } = slotFor(s, b);
      return {
        pnr: b.pnr,
        status: b.status,
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        adults: b.adults,
        children: b.children,
        infants: b.infants,
        totalCents: b.totalCents,
        tourTitle: tour.title,
        startsAt: slot.startsAt,
        meetingPoint: tour.meetingPoint,
        meetingAddress: tour.meetingAddress,
        mapUrl: tour.mapUrl,
      };
    }),
    settings: {
      googleAdsId: s.settings.googleAdsId,
      googleAdsLabel: s.settings.googleAdsLabel,
    },
  };
}

export function requireBookingManagement(
  s: PlatformState,
  pnr: string,
  proof: string,
) {
  const b = s.bookings.find((b) => b.pnr === pnr);
  if (
    !b ||
    !verifyBookingManagementProof(proof, b.id, b.pnr) ||
    new Date(b.expiresAt).getTime() < Date.now()
  )
    throw new HttpError(404, "Link prenotazione non valido o scaduto");
  return b;
}
export async function managedBooking(pnr: string, proof: string) {
  const s = await readState();
  const b = requireBookingManagement(s, pnr, proof);
  const { tour, slot } = slotFor(s, b);
  const hours = b.policy?.cancellationHours ?? s.settings.cancellationHours;
  const late = b.policy?.lateRefundPercent ?? s.settings.lateRefundPercent;
  const beforeStart = new Date(slot.startsAt).getTime() > Date.now();
  const free =
    new Date(slot.startsAt).getTime() - Date.now() >= hours * 3600000;
  const order = s.orders.find((o) => o.id === b.orderId)!;
  return {
    pnr: b.pnr,
    tourTitle: tour.title,
    name: b.name,
    startsAt: slot.startsAt,
    slotId: b.slotId,
    adults: b.adults,
    children: b.children,
    infants: b.infants,
    totalGuests: b.totalGuests,
    totalCents: b.totalCents,
    status: b.status,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod,
    whatsappConsent: b.whatsappConsent,
    meetingPoint: tour.meetingPoint,
    meetingAddress: tour.meetingAddress,
    mapUrl: tour.mapUrl,
    canMove: b.status === "confirmed" && free && tour.published,
    canCancel: ["confirmed", "pending"].includes(b.status) && beforeStart,
    cancellationHours: hours,
    refundPreviewCents:
      b.paymentStatus === "paid"
        ? Math.round(b.totalCents * (free ? 1 : late / 100))
        : 0,
    refundCents: b.refundCents,
    refundStatus: b.refundStatus,
    cancellationReason: b.cancellationReason,
    calendarUrl: `/api/calendar/booking/${b.pnr}?manage=${proof}`,
    paymentUrl: b.status === "pending" ? order.paymentUrl : undefined,
    paymentAmountCents: order.totalCents,
    slots: tour.slots
      .filter(
        (x) =>
          x.id === b.slotId ||
          (new Date(x.startsAt).getTime() >
            Date.now() + tour.bookingCutoffHours * 3600000 &&
            x.capacity - x.reserved >= b.totalGuests),
      )
      .map((x) => ({
        id: x.id,
        startsAt: x.startsAt,
        available: x.capacity - x.reserved,
      }))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  };
}
export async function bookingConsent(
  pnr: string,
  proof: string,
  consent: boolean,
) {
  return transaction((s) => {
    const b = requireBookingManagement(s, pnr, proof);
    b.whatsappConsent = consent;
    b.consentAt = new Date().toISOString();
    for (const j of s.jobs.filter(
      (j) =>
        j.type === "whatsapp" && j.bookingPnr === pnr && j.status === "queued",
    )) {
      j.status = "failed";
      j.error = "Preferenze cliente aggiornate";
    }
    if (consent && b.status === "confirmed") {
      const { slot } = slotFor(s, b);
      if (
        new Date(slot.startsAt).getTime() > Date.now() &&
        !s.jobs.some(
          (j) =>
            j.bookingPnr === pnr &&
            j.type === "whatsapp" &&
            j.key.includes(b.slotId) &&
            j.status === "sent",
        )
      )
        enqueue(s, {
          key: `wa:${pnr}:${b.slotId}:consent:${b.consentAt}`,
          type: "whatsapp",
          bookingPnr: pnr,
          to: b.phone,
          runAt: new Date(
            Math.max(
              Date.now(),
              new Date(slot.startsAt).getTime() -
                s.settings.reminderHours * 3600000,
            ),
          ).toISOString(),
        });
    }
    audit(s, "customer-link", "consent.whatsapp", pnr);
  });
}
