import Stripe from "stripe";
import nodemailer from "nodemailer";
import { readState, transaction } from "./store";
import { enqueue, notification, releaseExpired, slotFor } from "./booking";
import { HttpError } from "./security";
import { site } from "../site";
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new HttpError(503, "Stripe non configurato");
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    timeout: 10000,
    maxNetworkRetries: 0,
  });
}
export async function preparePayment(orderId: string) {
  const s = await readState();
  const order = s.orders.find((o) => o.id === orderId)!;
  if (order.paymentUrl) return order;
  const checkout = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      customer_email: s.bookings.find((b) => b.orderId === orderId)!.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: order.totalCents,
            product_data: { name: `Tour a Praga · ${order.pnrs.join(", ")}` },
          },
        },
      ],
      metadata: { orderId },
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      success_url: `${site.url}/prenotazione/confermata?payment=success`,
      cancel_url: `${site.url}/prenotazione/confermata?payment=cancelled`,
    },
    { idempotencyKey: `checkout:${order.id}` },
  );
  return transaction((s) => {
    const o = s.orders.find((o) => o.id === orderId)!;
    o.expiresAt = new Date(checkout.expires_at * 1000).toISOString();
    o.paymentUrl = checkout.url || undefined;
    o.stripeSessionId = checkout.id;
    for (const b of s.bookings.filter((b) => b.orderId === o.id))
      notification(s, b, "Pagamento da completare");
    return { ...o };
  });
}
export async function stripeWebhook(body: string, signature: string) {
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    throw new HttpError(503, "Webhook non configurato");
  const event = stripe().webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
  await transaction((s) => {
    if (s.events.includes(event.id)) return;
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      const o = s.orders.find((o) => o.id === session.metadata?.orderId);
      if (
        !o ||
        o.stripeSessionId !== session.id ||
        session.amount_total !== o.totalCents ||
        session.currency !== "eur"
      )
        throw new HttpError(400, "Pagamento non corrispondente");
      if (session.payment_status !== "paid") return;
      o.paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      const rows = s.bookings.filter((b) => b.orderId === o.id);
      // A payment arriving after the hold was released never resurrects sold seats.
      if (rows.some((b) => b.status === "cancelled")) {
        for (const b of rows) {
          if (b.status !== "cancelled") {
            slotFor(s, b).slot.reserved -= b.totalGuests;
            b.status = "cancelled";
            b.cancellationReason =
              "Pagamento ricevuto dopo la cancellazione di una voce dell’ordine";
          }
          b.paymentStatus = "paid";
          b.refundCents = b.totalCents;
          b.refundStatus = "queued";
          notification(s, b, "Cancellata e rimborso richiesto");
        }
        enqueue(s, {
          key: `late-refund:${o.id}`,
          type: "refund",
          orderId: o.id,
          amount: o.totalCents,
          runAt: new Date().toISOString(),
        });
      } else
        for (const b of rows) {
          const alreadyPaid = b.paymentStatus === "paid";
          b.paymentStatus = "paid";
          b.status = "confirmed";
          if (!alreadyPaid) notification(s, b, "Pagamento ricevuto");
        }
    }
    if (event.type === "checkout.session.expired") {
      const o = s.orders.find(
        (o) => o.stripeSessionId === event.data.object.id,
      );
      if (o) {
        o.expiresAt = new Date(0).toISOString();
        releaseExpired(s);
      }
    }
    if (
      ["refund.created", "refund.updated", "refund.failed"].includes(event.type)
    ) {
      const refund = event.data.object as Stripe.Refund;
      const job = s.jobs.find((j) => j.id === refund.metadata?.jobId);
      if (job) {
        job.providerId = refund.id;
        if (refund.status === "failed") {
          job.status = "failed";
          job.error = "Rimborso rifiutato dal provider: verificare su Stripe";
        }
        for (const b of s.bookings.filter((b) =>
          job.bookingPnr ? b.pnr === job.bookingPnr : b.orderId === job.orderId,
        )) {
          b.refundStatus = refund.status || "pending";
          if (refund.status === "succeeded") b.paymentStatus = "refunded";
        }
      }
    }
    s.events.push(event.id);
  });
}
export async function runJobs() {
  await transaction((s) => {
    releaseExpired(s);
  });
  const results = [];
  const deadline = Date.now() + 35000;
  for (let index = 0; index < 20 && Date.now() + 15000 < deadline; index++) {
    const job = await transaction((s) => {
      const j = s.jobs.find(
        (j) =>
          (j.status === "queued" ||
            (j.status === "running" &&
              new Date(j.leaseUntil || 0).getTime() < Date.now())) &&
          new Date(j.runAt).getTime() <= Date.now(),
      );
      if (!j) return null;
      j.status = "running";
      j.attempts++;
      j.leaseUntil = new Date(Date.now() + 300000).toISOString();
      return structuredClone(j);
    });
    if (!job) break;
    let refundResult: Stripe.Refund | undefined;
    try {
      const s = await readState();
      const b = s.bookings.find((b) => b.pnr === job.bookingPnr);
      if (job.type === "email") {
        if (!process.env.SMTP_HOST) throw new Error("SMTP non configurato");
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_PORT === "465",
          requireTLS: process.env.SMTP_PORT !== "465",
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 12000,
        });
        const { to, subject, text } = job;
        await transport.sendMail({
          from: process.env.SMTP_FROM,
          to,
          subject,
          text,
          messageId: `<${job.id}@freetourpraga.com>`,
        });
      } else if (job.type === "whatsapp") {
        if (!b || b.status === "cancelled" || !b.whatsappConsent)
          throw new Error("Reminder annullato");
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const auth = process.env.TWILIO_AUTH_TOKEN;
        if (
          !sid ||
          !auth ||
          !process.env.TWILIO_CONTENT_SID ||
          !process.env.TWILIO_WHATSAPP_FROM
        )
          throw new Error("Twilio/template WhatsApp non configurato");
        const { tour, slot } = slotFor(s, b);
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${sid}:${auth}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
              To: `whatsapp:${b.phone}`,
              ContentSid: process.env.TWILIO_CONTENT_SID,
              ContentVariables: JSON.stringify({
                "1": b.name,
                "2": tour.title,
                "3": new Date(slot.startsAt).toLocaleString("it-IT", {
                  timeZone: "Europe/Prague",
                }),
                "4": tour.meetingAddress,
                "5": b.pnr,
              }),
            }),
            signal: AbortSignal.timeout(12000),
          },
        );
        if (!response.ok) throw new Error(`Twilio HTTP ${response.status}`);
      } else {
        const o = s.orders.find((o) => o.id === job.orderId);
        if (!o?.paymentIntentId)
          throw new Error("Pagamento non disponibile per rimborso");
        refundResult = await stripe().refunds.create(
          {
            payment_intent: o.paymentIntentId,
            amount: job.amount,
            metadata: { jobId: job.id },
          },
          { idempotencyKey: job.key },
        );
      }
      await transaction((s) => {
        const j = s.jobs.find((j) => j.id === job.id)!;
        j.status = "sent";
        j.error = undefined;
        if (job.type === "refund" && refundResult) {
          j.providerId = refundResult.id;
          for (const b of s.bookings.filter((b) =>
            job.bookingPnr
              ? b.pnr === job.bookingPnr
              : b.orderId === job.orderId,
          )) {
            b.refundStatus = refundResult.status || "pending";
            if (refundResult.status === "succeeded")
              b.paymentStatus = "refunded";
          }
        }
      });
      results.push({ id: job.id, status: "sent" });
    } catch (e) {
      await transaction((s) => {
        const j = s.jobs.find((j) => j.id === job.id)!;
        j.status = j.attempts >= 5 ? "failed" : "queued";
        j.runAt = new Date(Date.now() + 2 ** j.attempts * 60000).toISOString();
        j.error = e instanceof Error ? e.message : "Errore provider";
      });
      results.push({ id: job.id, status: "retry" });
    }
  }
  return results;
}
