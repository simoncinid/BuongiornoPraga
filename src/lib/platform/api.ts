import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { audit, localMode, readState, transaction } from "./store";
import {
  bearer,
  checkOrigin,
  checkPassword,
  HttpError,
  jsonBody,
  rateLimit,
  requireStaff,
  sessionToken,
} from "./security";
import {
  affiliateSchema,
  checkoutSchema,
  pageSchema,
  settingsSchema,
  tourSchema,
} from "./validation";
import {
  slotFor,
  cancelReservation,
  createOrder,
  orderConfirmation,
  managedBooking,
  bookingConsent,
  enqueue,
  moveReservation,
  notification,
  quote,
  releaseExpired,
} from "./booking";
import { preparePayment, runJobs } from "./providers";
import { approveOta, ingestOta, otaSchema, pollMailbox } from "./ota";
import type { Session } from "./security";
import { maintainPrivacy } from "./maintenance";
import { uploadMedia } from "./media";
import { siteContent } from "./content";
import { siteContentSchema } from "./content-validation";
import { site } from "../site";
const ok = (data: unknown) =>
  NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
export async function platformApi(request: Request, path: string[]) {
  try {
    checkOrigin(request);
    const url = new URL(request.url);
    const route = path.join("/");
    const method = request.method;
    if (route === "health") {
      await readState();
      return ok({
        status: "ok",
        storage: localMode() ? "local-preview" : "postgresql",
      });
    }
    if (route === "catalog" && method === "GET") {
      const s = await readState();
      return ok({
        tours: s.tours
          .filter((t) => t.published)
          .map((t) => ({
            ...t,
            slots: t.slots.filter(
              (x) =>
                new Date(x.startsAt).getTime() >
                Date.now() + t.bookingCutoffHours * 3600000,
            ),
          })),
        settings: {
          multiTourPercent: s.settings.multiTourPercent,
          minimumTours: s.settings.minimumTours,
          cancellationHours: s.settings.cancellationHours,
          googleAdsId: s.settings.googleAdsId,
          googleAdsLabel: s.settings.googleAdsLabel,
        },
      });
    }
    if (route === "login" && method === "POST") {
      await rateLimit(request, "login", 5);
      const body = z
        .object({ email: z.string().email(), password: z.string().max(200) })
        .parse(await jsonBody(request));
      let users: {
        email: string;
        passwordHash: string;
        role: Session["role"];
      }[] = [];
      try {
        users = JSON.parse(process.env.STAFF_USERS || "[]");
      } catch {
        throw new HttpError(503, "Configurazione utenti non valida");
      }
      const user = users.find(
        (u) => u.email.toLowerCase() === body.email.toLowerCase(),
      );
      const validPassword = checkPassword(
        body.password,
        user?.passwordHash || `${"0".repeat(32)}:${"0".repeat(128)}`,
      );
      if (!user || !["admin", "operator"].includes(user.role) || !validPassword)
        throw new HttpError(401, "Email o password non validi");
      const response = ok({ ok: true });
      response.cookies.set("ftp_session", sessionToken(user.email, user.role), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 28800,
        path: "/",
      });
      return response;
    }
    if (route === "logout" && method === "POST") {
      const response = ok({ ok: true });
      response.cookies.delete("ftp_session");
      return response;
    }
    if (route === "quote" && method === "POST") {
      await rateLimit(request, "quote", 60);
      const body = checkoutSchema
        .pick({ items: true, affiliateCode: true })
        .parse(await jsonBody(request));
      const s = await transaction((s) => {
        releaseExpired(s);
        return s;
      });
      return ok({ items: quote(s, body) });
    }
    if (route === "checkout" && method === "POST") {
      await rateLimit(request, "checkout", 15);
      const body = checkoutSchema.parse(await jsonBody(request));
      const key = request.headers.get("idempotency-key");
      if (!key || key.length > 100)
        throw new HttpError(400, "Idempotency-Key richiesta");
      let order = await createOrder(body, key);
      if (body.paymentMethod === "stripe" && order.totalCents > 0)
        order = await preparePayment(order.id);
      if (body.paymentMethod === "stripe" && order.totalCents === 0)
        await transaction((s) => {
          for (const b of s.bookings.filter((b) => b.orderId === order.id)) {
            b.status = "confirmed";
            b.paymentStatus = "not_required";
            notification(s, b, "Confermata");
          }
        });
      return ok({
        order: { pnrs: order.pnrs, totalCents: order.totalCents },
        confirmationUrl: "/prenotazione/confermata",
        receiptProof: order.token,
        paymentUrl: order.paymentUrl,
      });
    }
    if (path[0] === "manage" && path.length === 2 && method === "POST") {
      await rateLimit(request, "manage-booking", 60);
      const body = z
        .object({
          proof: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
          action: z.enum(["view", "move", "cancel", "consent"]).default("view"),
          slotId: z.string().max(200).optional(),
          reason: z.string().trim().min(2).max(1000).optional(),
          consent: z.boolean().optional(),
        })
        .parse(await jsonBody(request));
      const pnr = path[1];
      if (body.action === "move") {
        if (!body.slotId) throw new HttpError(400, "Seleziona una partenza");
        await moveReservation(pnr, body.slotId, "customer-link", body.proof);
      }
      if (body.action === "cancel") {
        if (!body.reason) throw new HttpError(400, "Indica il motivo");
        await cancelReservation(pnr, body.reason, "customer-link", body.proof);
      }
      if (body.action === "consent") {
        if (typeof body.consent !== "boolean")
          throw new HttpError(400, "Preferenza mancante");
        await bookingConsent(pnr, body.proof, body.consent);
      }
      return ok(await managedBooking(pnr, body.proof));
    }
    if (route === "lookup" || path[0] === "customer")
      throw new HttpError(410, "Area cliente non prevista");
    if (route === "confirmation" && method === "POST") {
      await rateLimit(request, "confirmation", 60);
      const { proof } = z
        .object({ proof: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
        .parse(await jsonBody(request));
      return ok(await orderConfirmation(proof));
    }
    if (route === "inquiry" && method === "POST") {
      await rateLimit(request, "inquiry", 5);
      const body = z
        .object({
          name: z.string().trim().min(2).max(120),
          email: z.string().email(),
          message: z.string().min(10).max(5000),
          type: z.string().max(80),
          privacy: z.literal(true),
          website: z.string().max(0).optional(),
        })
        .parse(await jsonBody(request));
      await transaction((s) => {
        const inquiry = {
          ...body,
          id: randomUUID(),
          createdAt: new Date().toISOString(),
          status: "new",
        };
        s.inquiries.push(inquiry);
        enqueue(s, {
          key: `inquiry:${inquiry.id}`,
          type: "email",
          to:
            process.env.ADMIN_EMAIL || siteContent(s.siteContent).globals.email,
          subject: `Richiesta ${body.type}`,
          text: `${body.name}\n${body.email}\n${body.message}`,
          runAt: new Date().toISOString(),
        });
      });
      return ok({ ok: true });
    }
    if (route === "cron" && (method === "POST" || method === "GET")) {
      bearer(request, "CRON_SECRET");
      const task = url.searchParams.get("task") || "jobs";
      if (task === "mailbox") return ok({ mailbox: await pollMailbox() });
      if (task === "maintenance") return ok(await maintainPrivacy());
      return ok({ jobs: await runJobs() });
    }
    if (route === "ota/inbound" && method === "POST") {
      bearer(request, "OTA_WEBHOOK_SECRET");
      return ok(await ingestOta(otaSchema.parse(await jsonBody(request))));
    }
    if (path[0] === "admin") {
      const user = await requireStaff();
      const section = path[1];
      if (route === "admin/media" && method === "POST")
        return ok(await uploadMedia(request));
      if (route === "admin/state" && method === "GET") {
        const s = await readState();
        return ok({
          ...s,
          rateLimits: undefined,
          events: undefined,
          orders: undefined,
          bookings: s.bookings.map(({ tokenHash, ...b }) => b),
          role: user.role,
          siteContent: siteContent(s.siteContent),
          integrations: {
            database: !localMode(),
            stripe: !!process.env.STRIPE_SECRET_KEY,
            smtp: !!process.env.SMTP_HOST,
            whatsapp: !!process.env.TWILIO_CONTENT_SID,
            imap: !!process.env.IMAP_HOST,
          },
        });
      }
      if (route === "admin/export" && method === "GET") {
        const s = await readState();
        const cell = (v: unknown) =>
          `"${String(v ?? "")
            .replace(/^[=+@-]/, "'")
            .replaceAll('"', '""')}"`;
        const rows = [
          [
            "PNR",
            "Cliente",
            "Email",
            "Tour",
            "Partenza",
            "Partecipanti",
            "Totale EUR",
            "Stato",
            "Pagamento",
            "Canale",
            "Affiliato",
          ],
          ...s.bookings.map((b) => [
            b.pnr,
            b.name,
            b.email,
            b.tourSlug,
            b.slotId,
            b.totalGuests,
            (b.totalCents / 100).toFixed(2),
            b.status,
            b.paymentStatus,
            b.source,
            b.affiliateCode,
          ]),
        ];
        return new NextResponse(
          "\uFEFF" + rows.map((r) => r.map(cell).join(";")).join("\r\n"),
          {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": 'attachment; filename="prenotazioni.csv"',
              "Cache-Control": "no-store",
            },
          },
        );
      }
      if (route === "admin/manual" && method === "POST") {
        const input = checkoutSchema.parse(await jsonBody(request));
        return ok(
          await createOrder(
            input,
            `manual:${request.headers.get("idempotency-key") || randomUUID()}`,
            `manual:${user.email}`,
          ),
        );
      }
      if (section === "booking" && method === "PATCH") {
        const body = z
          .object({
            pnr: z.string(),
            name: z.string().trim().min(2).max(120).optional(),
            email: z.string().email().max(254).optional(),
            phone: z
              .string()
              .regex(/^\+[1-9]\d{6,14}$/)
              .optional(),
            adults: z.number().int().min(1).max(100).optional(),
            children: z.number().int().min(0).max(100).optional(),
            infants: z.number().int().min(0).max(100).optional(),
            action: z.enum(["cancel", "move", "update", "refund-record"]),
            confirmRefund: z.boolean().optional(),
            reason: z.string().max(1000).optional(),
            slotId: z.string().optional(),
            notes: z.string().max(2000).optional(),
            status: z.enum(["confirmed", "present", "no_show"]).optional(),
            paymentStatus: z
              .enum(["paid", "pending", "not_required"])
              .optional(),
            notify: z.boolean().default(false),
          })
          .parse(await jsonBody(request));
        if (body.action === "refund-record") {
          if (body.confirmRefund !== true)
            throw new HttpError(
              400,
              "Conferma il rimborso effettivamente eseguito",
            );
          await transaction((s) => {
            const b = s.bookings.find((b) => b.pnr === body.pnr);
            if (
              !b ||
              b.status !== "cancelled" ||
              b.paymentMethod === "stripe" ||
              !b.refundCents
            )
              throw new HttpError(409, "Nessun rimborso manuale da registrare");
            if (b.refundStatus === "succeeded") return;
            b.refundStatus = "succeeded";
            b.paymentStatus = "refunded";
            notification(s, b, "Rimborso effettuato");
            audit(s, user.email, "refund.manual-recorded", b.pnr);
          });
          return ok({ ok: true });
        }
        if (body.action === "cancel")
          return ok(
            await cancelReservation(
              body.pnr,
              body.reason || "Cancellazione staff",
              user.email,
            ),
          );
        if (body.action === "move")
          return ok(
            await moveReservation(body.pnr, body.slotId || "", user.email),
          );
        return ok(
          await transaction((s) => {
            const b = s.bookings.find((x) => x.pnr === body.pnr);
            if (!b) throw new HttpError(404, "Prenotazione non trovata");
            if (b.status === "cancelled")
              throw new HttpError(409, "Prenotazione cancellata");
            const nextAdults = body.adults ?? b.adults,
              nextChildren = body.children ?? b.children,
              nextInfants = body.infants ?? b.infants;
            const changed =
              nextAdults !== b.adults ||
              nextChildren !== b.children ||
              nextInfants !== b.infants;
            if (changed) {
              if (b.paymentMethod !== "cash" || b.paymentStatus === "paid")
                throw new HttpError(
                  409,
                  "Per cambiare i partecipanti di prenotazioni già pagate o OTA, gestisci prima l’adeguamento con il cliente e il provider.",
                );
              const { tour, slot } = slotFor(s, b);
              const guests = nextAdults + nextChildren + nextInfants;
              const delta = guests - b.totalGuests;
              if (delta > slot.capacity - slot.reserved)
                throw new HttpError(409, "Posti insufficienti");
              const rate = b.subtotalCents
                ? b.discountCents / b.subtotalCents
                : 0;
              const commission = b.totalCents
                ? b.commissionCents / b.totalCents
                : 0;
              b.subtotalCents =
                nextAdults * (b.unitAdultCents ?? tour.basePriceCents) +
                nextChildren * (b.unitChildCents ?? tour.childPriceCents) +
                nextInfants * (b.unitInfantCents ?? tour.infantPriceCents);
              b.discountCents = Math.round(b.subtotalCents * rate);
              b.totalCents = b.subtotalCents - b.discountCents;
              b.commissionCents = Math.round(b.totalCents * commission);
              slot.reserved += delta;
              b.adults = nextAdults;
              b.children = nextChildren;
              b.infants = nextInfants;
              b.totalGuests = guests;
              const order = s.orders.find((o) => o.id === b.orderId)!;
              order.totalCents = s.bookings
                .filter((x) => x.orderId === order.id)
                .reduce((n, x) => n + x.totalCents, 0);
            }
            const contactChanged =
              (body.email && body.email.toLowerCase() !== b.email) ||
              (body.name && body.name !== b.name);
            if (contactChanged)
              for (const job of s.jobs.filter(
                (j) =>
                  j.bookingPnr === b.pnr &&
                  j.type === "email" &&
                  j.status === "queued",
              )) {
                job.status = "failed";
                job.error =
                  "Contatti corretti dallo staff; vecchio destinatario invalidato";
              }
            if (body.name) b.name = body.name;
            if (body.email) b.email = body.email.toLowerCase();
            if (body.phone) b.phone = body.phone;
            if (body.notes !== undefined) b.notes = body.notes;
            if (
              body.status &&
              b.paymentMethod === "stripe" &&
              b.paymentStatus !== "paid"
            )
              throw new HttpError(
                409,
                "La conferma Stripe richiede il pagamento verificato.",
              );
            if (body.status) b.status = body.status;
            if (body.paymentStatus) {
              if (b.paymentMethod === "stripe")
                throw new HttpError(
                  409,
                  "I pagamenti Stripe sono aggiornati dal webhook",
                );
              b.paymentStatus = body.paymentStatus;
            }
            if (body.notify) notification(s, b, "Aggiornata");
            audit(s, user.email, "booking.update", b.pnr);
            return b;
          }),
        );
      }
      if (route === "admin/ota/close" && method === "POST") {
        const body = z
          .object({ id: z.string() })
          .parse(await jsonBody(request));
        await transaction((s) => {
          const m = s.ota.find((m) => m.id === body.id);
          if (m && m.status === "review") {
            m.status = "rejected";
            audit(s, user.email, "ota.review.close", m.id);
          }
        });
        return ok({ ok: true });
      }
      if (route === "admin/ota" && method === "POST")
        return ok(await ingestOta(otaSchema.parse(await jsonBody(request))));
      if (route === "admin/ota/approve" && method === "POST") {
        const body = z
          .object({ id: z.string(), booking: checkoutSchema })
          .parse(await jsonBody(request));
        return ok(await approveOta(body.id, body.booking));
      }
      if (route === "admin/jobs/retry" && method === "POST") {
        const { id } = z
          .object({ id: z.string() })
          .parse(await jsonBody(request));
        await transaction((s) => {
          const j = s.jobs.find((j) => j.id === id);
          if (j && j.status === "failed") {
            j.status = "queued";
            j.attempts = 0;
            j.runAt = new Date().toISOString();
            audit(s, user.email, "job.retry", id);
          }
        });
        return ok({ ok: true });
      }
      if (route === "admin/jobs/run" && method === "POST")
        return ok({ results: await runJobs() });
      if (route === "admin/inquiry" && method === "PATCH") {
        const body = z
          .object({ id: z.string(), status: z.enum(["new", "handled"]) })
          .parse(await jsonBody(request));
        await transaction((s) => {
          const i = s.inquiries.find((i) => i.id === body.id);
          if (i) i.status = body.status;
        });
        return ok({ ok: true });
      }
      if (section === "affiliate" && path[2] === "qr" && method === "GET") {
        const code = url.searchParams.get("code") || "";
        const s = await readState();
        if (!s.affiliates.some((a) => a.code === code))
          throw new HttpError(404, "Affiliato non trovato");
        return new NextResponse(
          await QRCode.toString(
            `${site.url}/?ref=${encodeURIComponent(code)}`,
            { type: "svg", width: 400, margin: 2 },
          ),
          {
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "private, no-store",
            },
          },
        );
      }
      // Commercial configuration and content publishing are restricted to administrators.
      await requireStaff(["admin"]);
      if (route === "admin/site-content" && method === "PUT") {
        const content = siteContentSchema.parse(await jsonBody(request));
        await transaction((s) => {
          s.siteContent = content;
          audit(s, user.email, "site-content.publish", "global");
        });
        return ok({ ok: true });
      }

      if (section === "tour" && method === "PUT") {
        const input = tourSchema.parse(await jsonBody(request));
        return ok(
          await transaction((s) => {
            if (input.childMinAge >= input.adultMinAge)
              throw new HttpError(400, "Fasce di età non valide");
            if (s.tours.some((t) => t.id !== input.id && t.slug === input.slug))
              throw new HttpError(409, "Slug già in uso");
            const old = s.tours.find((t) => t.id === input.id);
            if (
              old &&
              old.slug !== input.slug &&
              s.bookings.some((b) => b.tourSlug === old.slug)
            )
              throw new HttpError(
                409,
                "Slug non modificabile con prenotazioni esistenti",
              );
            if (
              new Set(input.slots.map((x) => x.id)).size !== input.slots.length
            )
              throw new HttpError(400, "ID partenza duplicati");
            for (const slot of input.slots) {
              if (
                s.tours.some(
                  (t) =>
                    t.id !== input.id && t.slots.some((x) => x.id === slot.id),
                )
              )
                throw new HttpError(409, "ID partenza già usato");
              const previous = old?.slots.find((x) => x.id === slot.id);
              slot.reserved = previous?.reserved || 0;
              if (slot.capacity < slot.reserved)
                throw new HttpError(
                  409,
                  "Capienza inferiore ai posti già prenotati",
                );
              if (new Date(slot.endsAt) <= new Date(slot.startsAt))
                throw new HttpError(400, "Fine partenza non valida");
              if (
                previous &&
                previous.reserved &&
                previous.startsAt !== slot.startsAt
              )
                throw new HttpError(
                  409,
                  "Crea una nuova partenza e sposta le prenotazioni prima di cambiare orario",
                );
            }
            if (
              old?.slots.some(
                (x) =>
                  x.reserved > 0 && !input.slots.some((n) => n.id === x.id),
              )
            )
              throw new HttpError(
                409,
                "Non puoi eliminare partenze con prenotazioni",
              );
            const index = s.tours.findIndex((t) => t.id === input.id);
            if (index < 0) s.tours.push(input);
            else s.tours[index] = input;
            audit(s, user.email, "tour.save", input.slug);
            return input;
          }),
        );
      }
      if (section === "settings" && method === "PUT") {
        const input = settingsSchema.parse(await jsonBody(request));
        await transaction((s) => {
          s.settings = input;
          audit(s, user.email, "settings.save", "commercial");
        });
        return ok({ ok: true });
      }
      if (section === "page" && method === "PUT") {
        const body = z
          .object({ key: z.string().regex(/^[a-z0-9-]+$/), page: pageSchema })
          .parse(await jsonBody(request));
        await transaction((s) => {
          s.pages[body.key] = body.page;
          audit(s, user.email, "page.save", body.key);
        });
        return ok({ ok: true });
      }
      if (section === "affiliate" && method === "PUT") {
        const a = affiliateSchema.parse(await jsonBody(request));
        await transaction((s) => {
          s.affiliates = s.affiliates.filter((x) => x.code !== a.code);
          s.affiliates.push(a);
          audit(s, user.email, "affiliate.save", a.code);
        });
        return ok({ ok: true });
      }
      if (route === "admin/commissions/pay" && method === "POST") {
        const { code } = z
          .object({ code: z.string() })
          .parse(await jsonBody(request));
        await transaction((s) => {
          for (const b of s.bookings.filter(
            (b) =>
              b.affiliateCode === code &&
              b.status === "present" &&
              !b.commissionPaid &&
              (b.paymentStatus === "paid" || b.paymentMethod === "cash"),
          ))
            b.commissionPaid = true;
          audit(s, user.email, "commissions.paid", code);
        });
        return ok({ ok: true });
      }
    }
    throw new HttpError(404, "Operazione non trovata");
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    if (e instanceof HttpError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Platform error", e instanceof Error ? e.name : "unknown");
    return NextResponse.json(
      { error: "Operazione non riuscita. Riprova o contatta lo staff." },
      { status: 500 },
    );
  }
}
