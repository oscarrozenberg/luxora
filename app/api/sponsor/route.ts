import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

const PLANS = {
  "3j": { price: 99, days: 3, label: "3 jours" },
  "7j": { price: 199, days: 7, label: "7 jours" },
  "30j": { price: 599, days: 30, label: "30 jours" },
};

export async function POST(req: NextRequest) {
  try {
    const { listingId, listingTitle, plan, successUrl, cancelUrl } = await req.json();

    const selectedPlan = PLANS[plan as keyof typeof PLANS];
    if (!selectedPlan) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Sponsoriser "${listingTitle}"`,
              description: `Annonce mise en avant pendant ${selectedPlan.label}`,
            },
            unit_amount: selectedPlan.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        listingId,
        plan,
        days: selectedPlan.days.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}