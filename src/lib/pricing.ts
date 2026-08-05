import { getTourBySlug } from "./data";

type PricingInput = {
  tourSlug: string;
  adults: number;
  children: number;
  infants: number;
  cartTourCount?: number;
};

export function calculatePrice(input: PricingInput) {
  const tour = getTourBySlug(input.tourSlug);
  if (!tour) throw new Error("Tour non trovato");

  const subtotalCents =
    input.adults * tour.basePriceCents +
    input.children * tour.childPriceCents +
    input.infants * tour.infantPriceCents;

  const multiTourDiscount = input.cartTourCount && input.cartTourCount > 1 ? Math.round(subtotalCents * 0.1) : 0;

  return {
    subtotalCents,
    discountCents: multiTourDiscount,
    totalCents: Math.max(0, subtotalCents - multiTourDiscount)
  };
}

export function availableSeats(capacity: number, reserved: number) {
  return Math.max(0, capacity - reserved);
}

export function availabilityLabel(capacity: number, reserved: number) {
  const remaining = availableSeats(capacity, reserved);
  if (remaining === 0) return "Sold out";
  if (remaining <= 3) return `Solo ${remaining} posti`;
  return `${remaining} posti disponibili`;
}
