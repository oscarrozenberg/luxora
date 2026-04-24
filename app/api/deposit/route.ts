import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const { depositIntentId, action } = await req.json();

    if (!depositIntentId) {
      return NextResponse.json({ error: "depositIntentId manquant" }, { status: 400 });
    }

    if (action === "refund") {
      // Annule l'autorisation et rembourse la caution
      await stripe.paymentIntents.cancel(depositIntentId);
      return NextResponse.json({ success: true, action: "refund" });
    }

    if (action === "capture") {
      // Debite la caution en cas de litige
      await stripe.paymentIntents.capture(depositIntentId);
      return NextResponse.json({ success: true, action: "capture" });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}