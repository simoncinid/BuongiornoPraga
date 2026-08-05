import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelBooking } from "@/lib/booking-store";

const schema = z.object({
  reason: z.string().min(2)
});

type Props = { params: Promise<{ pnr: string }> };

export async function POST(request: Request, { params }: Props) {
  try {
    const { pnr } = await params;
    const { reason } = schema.parse(await request.json());
    const booking = cancelBooking(pnr, reason);
    if (!booking) return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore cancellazione";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
