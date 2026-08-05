import { NextResponse } from "next/server";
import { z } from "zod";
import { requestBookingModification } from "@/lib/booking-store";

const schema = z.object({ request: z.string().min(2) });
type Props = { params: Promise<{ pnr: string }> };

export async function POST(request: Request, { params }: Props) {
  try {
    const { pnr } = await params;
    const body = schema.parse(await request.json());
    const booking = requestBookingModification(pnr, body.request);
    if (!booking) return NextResponse.json({ error: "Prenotazione non modificabile" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Errore modifica" }, { status: 400 });
  }
}
