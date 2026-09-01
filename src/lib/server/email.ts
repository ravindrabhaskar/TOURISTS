import { formatINR } from "@/lib/format";

interface MailInput {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail({ to, subject, text }: MailInput): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(
      `\n=== EMAIL (console provider — set RESEND_API_KEY to send for real) ===\nTo: ${to}\nSubject: ${subject}\n\n${text}\n=== /EMAIL ===\n`,
    );
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Trade Winds <bookings@tradewinds.travel>",
        to: [to],
        subject,
        text,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("Email send failed:", e);
    return false;
  }
}

export function travellerConfirmation(input: {
  ref: string;
  name: string;
  tripName: string;
  departureLabel: string;
  travellers: number;
  estTotal: number;
}): string {
  return [
    `Hi ${input.name},`,
    "",
    `Your enquiry is in — reference ${input.ref}.`,
    "",
    `Trip: ${input.tripName}`,
    `Departure: ${input.departureLabel}`,
    `Travellers: ${input.travellers}`,
    `Indicative total: ${formatINR(input.estTotal)} (${formatINR(Math.round(input.estTotal / Math.max(1, input.travellers)))} per person)`,
    "",
    "A planner replies within one working day with availability and a free 48-hour seat hold. Nothing is payable until you confirm in writing.",
    "",
    "Track anytime: /enquiry",
    "",
    "— Trade Winds Travel Co., Banjara Hills, Hyderabad",
  ].join("\n");
}

export function internalNotification(input: {
  ref: string;
  name: string;
  email: string;
  phone: string;
  tripName: string;
  departureLabel: string;
  travellers: number;
  estTotal: number;
  message?: string;
}): string {
  return [
    `New enquiry ${input.ref}`,
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    `Trip: ${input.tripName}`,
    `Departure: ${input.departureLabel}`,
    `Pax: ${input.travellers}`,
    `Estimate: ${formatINR(input.estTotal)}`,
    ...(input.message ? [`Message: ${input.message}`] : []),
    "",
    "Open the desk: /admin",
  ].join("\n");
}
