import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const COMMISSION_RATE = 0.12;

export async function POST(req: NextRequest) {
  try {
    const { listingId, listingTitle, basePrice, days, depositAmount, bookingId, ownerId, successUrl, cancelUrl } = await req.json();

    const commission = Math.round(basePrice * COMMISSION_RATE);
    const totalPrice = basePrice + commission;
    const platformFee = commission * 100; // en centimes

    // Recupere le compte Stripe Connect du loueur
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_verified")
      .eq("id", ownerId)
      .single();

    if (!ownerProfile?.stripe_account_id || !ownerProfile?.stripe_verified) {
      return NextResponse.json({
        error: "Le loueur n a pas encore configure son compte de paiement. Il doit le faire depuis son profil.",
        needsConnect: true,
      }, { status: 400 });
    }

    // Cree la session de paiement Stripe Connect
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
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Caution (remboursable)",
              description: "Remboursee apres verification de l etat de l article",
            },
            unit_amount: depositAmount * 100,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: ownerProfile.stripe_account_id,
        },
        metadata: {
          bookingId,
          listingId,
          ownerId,
          basePrice: basePrice.toString(),
          commission: commission.toString(),
          totalPrice: totalPrice.toString(),
          depositAmount: depositAmount.toString(),
        },
      },
      metadata: {
        bookingId,
        listingId,
        ownerId,
        basePrice: basePrice.toString(),
        commission: commission.toString(),
        totalPrice: totalPrice.toString(),
        depositAmount: depositAmount.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}