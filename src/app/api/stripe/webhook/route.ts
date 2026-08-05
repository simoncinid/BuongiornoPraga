import { NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";
import { bookings } from "@/lib/booking-store";

export async function POST(request: Request) {
  const stripe = stripeClient();
  const body = await request.text();

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: true, simulated: true });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const pnr = session.metadata?.pnr;
      const booking = bookings.find((candidate) => candidate.pnr === pnr);
      if (booking) {
        booking.paymentStatus = "paid";
        booking.status = "confirmed";
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook non valido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
