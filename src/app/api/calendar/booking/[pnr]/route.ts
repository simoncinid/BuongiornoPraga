import { NextResponse } from "next/server";
import { createEvent } from "ics";
import {
  getReservation,
  slotFor,
  requireBookingManagement,
} from "@/lib/platform/booking";
import { readState } from "@/lib/platform/store";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ pnr: string }> },
) {
  try {
    const s = await readState();
    const pnr = (await params).pnr;
    const query = new URL(request.url).searchParams;
    const b = query.has("manage")
      ? requireBookingManagement(s, pnr, query.get("manage") || "")
      : getReservation(s, pnr, query.get("token") || "");
    const { tour, slot } = slotFor(s, b);
    const date = (v: string): [number, number, number, number, number] => {
      const d = new Date(v);
      return [
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
      ];
    };
    const result = createEvent({
      uid: `${b.pnr}@freetourpraga.com`,
      start: date(slot.startsAt),
      end: date(slot.endsAt),
      startInputType: "utc",
      endInputType: "utc",
      title: tour.title,
      description: `Prenotazione ${b.pnr}. ${b.totalGuests} partecipanti.`,
      location: tour.meetingAddress,
      status: b.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
    });
    if (result.error) throw result.error;
    return new NextResponse(result.value, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${b.pnr}.ics"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Link non valido o scaduto" },
      { status: 404 },
    );
  }
}
