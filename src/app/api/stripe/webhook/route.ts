import { NextResponse } from "next/server";
import { stripeWebhook } from "@/lib/platform/providers";
export async function POST(request: Request) {
  try {
    await stripeWebhook(
      await request.text(),
      request.headers.get("stripe-signature") || "",
    );
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook rifiutato" }, { status: 400 });
  }
}
