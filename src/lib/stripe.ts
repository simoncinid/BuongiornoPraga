import Stripe from "stripe";
import type { BookingRecord } from "./types";

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia"
  });
}

export async function createStripePaymentLink(booking: BookingRecord) {
  const stripe = stripeClient();
  if (!stripe) throw new Error("Stripe non configurato");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: booking.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: booking.totalCents,
          product_data: {
            name: `${booking.tourTitle} - ${booking.pnr}`,
            description: `${booking.totalGuests} partecipanti`
          }
        }
      }
    ],
    metadata: {
      pnr: booking.pnr
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/prenotazione/${booking.pnr}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/prenotazione/${booking.pnr}?payment=cancelled`
  });

  booking.stripePaymentUrl = session.url || booking.stripePaymentUrl;
  return booking.stripePaymentUrl;
}
