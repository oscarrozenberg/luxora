import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

const COMMISSION_RATE = 0.12;

export async function POST(req: NextRequest) {
  try {
    const { listingId, listingTitle, basePrice, days, depositAmount, bookingId, successUrl, cancelUrl } = await req.json();

    const commission = Math.round(basePrice * COMMISSION_RATE);
    const totalPrice = basePrice + commission;

    // 1. Paiement de la location (debite immediatement)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Location : ${listingTitle}`,
              description: `${days} jour${days > 1 ? "s" : ""} de location`,
            },
            unit_amount: totalPrice * 100,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          bookingId,
          listingId,
          basePrice: basePrice.toString(),
          commission: commission.toString(),
          totalPrice: totalPrice.toString(),
          depositAmount: depositAmount.toString(),
          type: "rental",
        },
      },
      metadata: {
        bookingId,
        listingId,
        basePrice: basePrice.toString(),
        commission: commission.toString(),
        totalPrice: totalPrice.toString(),
        depositAmount: depositAmount.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // 2. Autorisation de la caution (bloquee mais pas debitee)
    const depositIntent = await stripe.paymentIntents.create({
      amount: depositAmount * 100,
      currency: "eur",
      capture_method: "manual",
      metadata: {
        bookingId,
        type: "deposit",
      },
      description: `Caution pour la location : ${listingTitle}`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      depositIntentId: depositIntent.id,
      depositClientSecret: depositIntent.client_secret,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}