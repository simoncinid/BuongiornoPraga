import { randomUUID } from "node:crypto";
import { site } from "./site";
import { getSlot } from "./data";
import { calculatePrice } from "./pricing";
import { createSelfServiceToken } from "./tokens";
import type { BookingFormInput, BookingRecord } from "./types";

const globalStore = globalThis as unknown as {
  bpBookings?: BookingRecord[];
};

export const bookings = globalStore.bpBookings ?? [];
globalStore.bpBookings = bookings;

function createPnr() {
  return `BP-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
}

export function createBooking(input: BookingFormInput): BookingRecord {
  const slotMatch = getSlot(input.slotId);
  if (!slotMatch || slotMatch.tour.slug !== input.tourSlug) {
    throw new Error("Slot non disponibile per il tour selezionato");
  }

  const totalGuests = input.adults + input.children + input.infants;
  if (totalGuests <= 0) throw new Error("Seleziona almeno un partecipante");

  const available = slotMatch.slot.capacity - slotMatch.slot.reserved;
  if (available < totalGuests) {
    throw new Error(`Disponibilita insufficiente: restano ${available} posti`);
  }

  const price = calculatePrice(input);
  const pnr = createPnr();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  const token = createSelfServiceToken(pnr, expiresAt);
  const selfServiceUrl = `${site.url}/self-service/${token}`;
  const paymentStatus = input.paymentMethod === "cash" ? "not_required" : "pending";

  slotMatch.slot.reserved += totalGuests;

  const booking: BookingRecord = {
    ...input,
    id: randomUUID(),
    pnr,
    tourTitle: slotMatch.tour.title,
    startsAt: slotMatch.slot.startsAt,
    totalGuests,
    subtotalCents: price.subtotalCents,
    discountCents: price.discountCents,
    totalCents: price.totalCents,
    paymentStatus,
    status: input.paymentMethod === "cash" ? "confirmed" : "pending",
    stripePaymentUrl:
      input.paymentMethod === "stripe"
        ? `${site.url}/pagamento?pnr=${encodeURIComponent(pnr)}&amount=${price.totalCents}`
        : undefined,
    selfServiceUrl,
    calendarUrl: `${site.url}/api/calendar/booking/${pnr}`,
    createdAt: new Date().toISOString()
  };

  bookings.unshift(booking);
  return booking;
}

export function findBookingByPnr(pnr: string) {
  return bookings.find((booking) => booking.pnr === pnr);
}

export function updateBookingStatus(pnr: string, status: BookingRecord["status"]) {
  const booking = findBookingByPnr(pnr);
  if (!booking) return null;
  booking.status = status;
  return booking;
}

export function cancelBooking(pnr: string, reason: string) {
  const booking = findBookingByPnr(pnr);
  if (!booking) return null;
  if (booking.status !== "cancelled") {
    const slotMatch = getSlot(booking.slotId);
    if (slotMatch) slotMatch.slot.reserved = Math.max(0, slotMatch.slot.reserved - booking.totalGuests);
  }
  booking.status = "cancelled";
  booking.notes = [booking.notes, `Cancellazione: ${reason}`].filter(Boolean).join("\n");
  return booking;
}

export function requestBookingModification(pnr: string, request: string) {
  const booking = findBookingByPnr(pnr);
  if (!booking || booking.status === "cancelled") return null;
  booking.status = "modified";
  booking.notes = [booking.notes, `Richiesta modifica: ${request}`].filter(Boolean).join("\n");
  return booking;
}
