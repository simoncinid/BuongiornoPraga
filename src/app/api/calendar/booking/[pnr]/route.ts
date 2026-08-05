import { NextResponse } from "next/server";
import { bookingIcs } from "@/lib/calendar";

type Props = { params: Promise<{ pnr: string }> };

export async function GET(_: Request, { params }: Props) {
  const { pnr } = await params;
  const ics = await bookingIcs(pnr);
  if (!ics) return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${pnr}.ics"`
    }
  });
}
