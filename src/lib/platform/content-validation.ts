import { z } from "zod";
import { tourSchema } from "./validation";
const short = z.string().trim().min(1).max(250),
  body = z.string().trim().min(1).max(5000);
const localPath = z
  .string()
  .max(500)
  .regex(/^\/(?!\/)[a-zA-Z0-9/_?=&#.%+-]*$/);
const https = z
  .string()
  .url()
  .max(1000)
  .refine((v) => new URL(v).protocol === "https:", "È richiesto un URL HTTPS");
export const siteContentSchema = z.object({
  globals: z.object({
    brandName: short,
    description: body,
    email: z.string().email().max(254),
    phone: z.string().regex(/^\+[1-9][\d\s()-]{6,30}$/),
    whatsappNumber: z.string().regex(/^[1-9]\d{6,14}$/),
    address: short,
    supportHours: short,
    footerText: body,
    footerNote: body,
    tripAdvisorUrl: https.refine((v) =>
      /(^|\.)tripadvisor\.(com|it)$/.test(new URL(v).hostname),
    ),
    tripAdvisorTitle: short,
    tripAdvisorBody: body,
    socialLinks: z.array(z.object({ label: short, url: https })).max(10),
    navigation: z
      .array(z.object({ label: short, href: localPath }))
      .min(1)
      .max(8),
  }),
  home: z.object({
    heroImage: tourSchema.shape.imageUrl,
    heroTitle: short,
    heroEyebrow: short,
    heroBody: body,
    primaryLabel: short,
    primaryHref: localPath,
    secondaryLabel: short,
    toursEyebrow: short,
    toursTitle: short,
    toursBody: body,
    trustEyebrow: short,
    trustTitle: short,
    trustBody: body,
    galleryEyebrow: short,
    galleryTitle: short,
    galleryBody: body,
    answersTitle: short,
    answersBody: body,
    partnerEyebrow: short,
    partnerTitle: short,
    partnerBody: body,
    partnerLabel: short,
    faqTitle: short,
    stats: z.array(z.object({ value: short, label: short })).max(8),
    pillars: z.array(z.object({ title: short, text: body })).max(12),
  }),
  gallery: z
    .array(
      z.object({
        title: short,
        caption: body,
        imageUrl: tourSchema.shape.imageUrl,
      }),
    )
    .max(20),
  faqs: z.array(z.object({ q: short, a: body })).max(50),
  answers: z.array(z.object({ question: short, answer: body })).max(30),
});
