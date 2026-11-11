import { z } from "zod";
const text = (max = 200) => z.string().trim().min(1).max(max);
export const itemSchema = z.object({
  tourSlug: text(),
  slotId: text(),
  adults: z.number().int().min(1).max(100),
  children: z.number().int().min(0).max(100).default(0),
  infants: z.number().int().min(0).max(100).default(0),
});
export const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1).max(10),
  name: text(120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{6,14}$/,
      "Usa il formato internazionale, es. +393331234567",
    ),
  notes: z.string().max(2000).default(""),
  paymentMethod: z.enum(["cash", "stripe"]),
  affiliateCode: z.string().max(40).default(""),
  termsAccepted: z.literal(true),
  whatsappConsent: z.boolean().default(false),
});
export const affiliateSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_-]{3,40}$/),
  name: text(120),
  email: z.string().email(),
  type: z.enum(["hotel", "guide", "promoter", "agency"]),
  commissionPercent: z.number().min(0).max(100),
  active: z.boolean(),
});
export const settingsSchema = z.object({
  multiTourPercent: z.number().min(0).max(100),
  minimumTours: z.number().int().min(2).max(10),
  cancellationHours: z.number().min(0).max(720),
  lateRefundPercent: z.number().min(0).max(100),
  retentionDays: z.number().int().min(30).max(3650),
  emailFooter: text(1000),
  reminderHours: z.number().min(1).max(168),
  googleAdsId: z.string().regex(/^(AW-\d+)?$/),
  googleAdsLabel: z.string().max(100),
});
export const tourSchema = z.object({
  id: text(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: text(),
  category: text(),
  shortDescription: text(1000),
  description: text(20000),
  imageUrl: z.string().refine((v) => {
    if (/^\/api\/media\/[-a-f0-9]{36}\.webp$/.test(v))
      return process.env.NODE_ENV !== "production";
    try {
      const u = new URL(v);
      return (
        u.protocol === "https:" &&
        (u.hostname === "images.unsplash.com" ||
          (!!process.env.MEDIA_PUBLIC_BASE &&
            u.origin === new URL(process.env.MEDIA_PUBLIC_BASE).origin))
      );
    } catch {
      return false;
    }
  }, "Usa una foto caricata o un URL immagini autorizzato"),
  meetingPoint: text(),
  meetingAddress: text(),
  mapUrl: z
    .string()
    .url()
    .refine((v) => new URL(v).hostname === "www.google.com"),
  mapEmbedUrl: z
    .string()
    .url()
    .refine((v) => new URL(v).hostname === "www.google.com"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  durationMinutes: z.number().int().min(15).max(1440),
  basePriceCents: z.number().int().min(0).max(10000000),
  childPriceCents: z.number().int().min(0).max(10000000),
  infantPriceCents: z.number().int().min(0).max(10000000),
  maxGuests: z.number().int().min(1).max(500),
  walkingDifficulty: z.number().min(1).max(5),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  language: text(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.array(z.string()).optional(),
  highlights: z.array(text(1000)).max(30),
  inclusions: z.array(text(1000)).max(30),
  safetyNotes: z.array(text(1000)).max(30),
  published: z.boolean(),
  adultMinAge: z.number().int().min(1).max(99),
  childMinAge: z.number().int().min(0).max(99),
  bookingCutoffHours: z.number().min(0).max(168),
  guide: z.string().max(120),
  otaAliases: z.array(z.string().max(300)).max(30).optional(),
  slots: z
    .array(
      z.object({
        id: text(),
        tourId: text(),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
        capacity: z.number().int().min(1).max(500),
        reserved: z.number().int().min(0),
      }),
    )
    .max(1000),
});
export const pageSchema = z.object({
  title: text(250),
  subtitle: z.string().max(1000),
  body: z.string().max(30000),
  seoTitle: z.string().max(200),
  seoDescription: z.string().max(500),
  published: z.boolean(),
});
