import { NextResponse } from "next/server";
import { z } from "zod";
import { createBooking } from "@/lib/booking-store";
import { sendBookingConfirmation } from "@/lib/email";
import { createStripePaymentLink } from "@/lib/stripe";

const bookingSchema = z.object({
  tourSlug: z.string().min(1),
  slotId: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  adults: z.number().int().min(0),
  children: z.number().int().min(0),
  infants: z.number().int().min(0),
  paymentMethod: z.enum(["cash", "stripe"]),
  notes: z.string().optional(),
  affiliateCode: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const input = bookingSchema.parse(await request.json());
    const booking = createBooking(input);

    if (booking.paymentMethod === "stripe") {
      await createStripePaymentLink(booking);
    }

    await sendBookingConfirmation(booking);

    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore prenotazione";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
