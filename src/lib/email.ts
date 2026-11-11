import nodemailer from "nodemailer";
import { formatDateTime, formatMoney } from "./format";
import { site } from "./site";
import type { BookingRecord } from "./types";

export function bookingEmailHtml(booking: BookingRecord) {
  const paymentBlock =
    booking.paymentMethod === "stripe"
      ? `<p><strong>Pagamento online:</strong> completa il pagamento da questo link: <a href="${booking.stripePaymentUrl}">${booking.stripePaymentUrl}</a></p>`
      : "<p><strong>Pagamento:</strong> contanti sul posto, secondo le condizioni concordate.</p>";

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#0B1D37;line-height:1.55">
      <h1>Conferma prenotazione ${booking.pnr}</h1>
      <p>Ciao ${booking.name}, la tua prenotazione per <strong>${booking.tourTitle}</strong> e stata registrata.</p>
      <p><strong>Quando:</strong> ${formatDateTime(booking.startsAt)}<br />
      <strong>Partecipanti:</strong> ${booking.totalGuests}<br />
      <strong>Totale:</strong> ${formatMoney(booking.totalCents)}</p>
      ${paymentBlock}
      <div style="background:#071A35;color:#fff;padding:20px;border-radius:12px;margin:24px 0">
        <h2 style="margin-top:0">Il tuo viaggio a Praga e al sicuro.</h2>
        <p>Salva immediatamente questo numero nei tuoi contatti: e la tua linea diretta con il nostro Triage Emergenze, attiva h24.</p>
        <p>Scrivici su WhatsApp per qualsiasi dubbio organizzativo o problema logistico prima, durante e dopo il tuo soggiorno. Non sei piu un turista isolato, sei un ospite protetto.</p>
      </div>
      <p><a href="${booking.selfServiceUrl}">Gestisci modifica o cancellazione</a></p>
      <p><a href="${booking.calendarUrl}">Aggiungi al calendario</a></p>
      <p>${site.name}</p>
    </div>
  `;
}

export function bookingEmailText(booking: BookingRecord) {
  return [
    `Conferma prenotazione ${booking.pnr}`,
    `${booking.name}, la tua prenotazione per ${booking.tourTitle} e stata registrata.`,
    `Quando: ${formatDateTime(booking.startsAt)}`,
    `Partecipanti: ${booking.totalGuests}`,
    `Totale: ${formatMoney(booking.totalCents)}`,
    booking.paymentMethod === "stripe" ? `Pagamento online: ${booking.stripePaymentUrl}` : "Pagamento: contanti sul posto.",
    "Il tuo viaggio a Praga e al sicuro. Salva il numero WhatsApp H24 nei tuoi contatti.",
    `Gestisci prenotazione: ${booking.selfServiceUrl}`,
    `Calendario: ${booking.calendarUrl}`
  ].join("\n");
}

export async function sendBookingConfirmation(booking: BookingRecord) {
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error("SMTP non configurato");

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `FreeTourPraga <${site.email}>`,
    to: booking.email,
    bcc: process.env.ADMIN_EMAIL,
    subject: `Conferma prenotazione ${booking.pnr} - ${booking.tourTitle}`,
    html: bookingEmailHtml(booking),
    text: bookingEmailText(booking)
  });

  return { simulated: false };
}
