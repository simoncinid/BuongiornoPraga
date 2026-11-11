import { createEvent } from "ics";
import { findBookingByPnr } from "./booking-store";
import { getSlot } from "./data";

function dateArray(value: string): [number, number, number, number, number] {
  const date = new Date(value);
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes()
  ];
}

export async function bookingIcs(pnr: string) {
  const booking = findBookingByPnr(pnr);
  if (!booking) return null;
  const slotMatch = getSlot(booking.slotId);
  if (!slotMatch) return null;

  return new Promise<string>((resolve, reject) => {
    createEvent(
      {
        uid: `${booking.pnr}@freetourpraga.com`,
        start: dateArray(slotMatch.slot.startsAt),
        end: dateArray(slotMatch.slot.endsAt),
        startInputType: "utc",
        endInputType: "utc",
        title: `${booking.tourTitle} - ${booking.pnr}`,
        description: `Prenotazione ${booking.pnr}. Partecipanti: ${booking.totalGuests}. Cliente: ${booking.name}.`,
        location: slotMatch.tour.meetingAddress,
        url: booking.selfServiceUrl,
        status: booking.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
        organizer: { name: "FreeTourPraga", email: "prenotazioni@freetourpraga.com" }
      },
      (error, value) => {
        if (error) reject(error);
        else resolve(value);
      }
    );
  });
}
