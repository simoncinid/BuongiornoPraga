export type AgeBand = "adults" | "children" | "infants";

export type PaymentMethod = "cash" | "stripe";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "modified"
  | "no_show"
  | "present";

export type PaymentStatus =
  | "not_required"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type Tour = {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  meetingPoint: string;
  meetingAddress: string;
  mapUrl: string;
  mapEmbedUrl: string;
  latitude: number;
  longitude: number;
  durationMinutes: number;
  basePriceCents: number;
  childPriceCents: number;
  infantPriceCents: number;
  adultMinAge?: number;
  childMinAge?: number;
  maxGuests: number;
  walkingDifficulty: number;
  rating: number;
  reviewCount: number;
  language: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  highlights: string[];
  inclusions: string[];
  safetyNotes: string[];
  slots: TourSlot[];
};

export type TourSlot = {
  id: string;
  tourId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reserved: number;
};

export type BookingFormInput = {
  tourSlug: string;
  slotId: string;
  name: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  infants: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  affiliateCode?: string;
};

export type BookingRecord = BookingFormInput & {
  id: string;
  pnr: string;
  tourTitle: string;
  startsAt: string;
  totalGuests: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  stripePaymentUrl?: string;
  selfServiceUrl: string;
  calendarUrl: string;
  createdAt: string;
};
