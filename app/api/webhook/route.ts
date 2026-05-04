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

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { bookingId, totalPrice, commission, basePrice, depositAmount } = session.metadata ?? {};

    if (bookingId) {
      // Marque la reservation comme payee mais fonds pas encore liberes
      await supabase
  .from("bookings")
  .update({
    status: "confirmed",
    payment_status: "paid",
    payment_intent_id: session.payment_intent as string,
  })
  .eq("id", bookingId);

// Recupere la reservation pour crediter le loueur en pending
const { data: booking } = await supabase
  .from("bookings")
  .select("owner_id, total_price")
  .eq("id", bookingId)
  .single();

if (booking) {
  const commission = Math.round(parseFloat(totalPrice ?? "0") * 0.12 / 1.12);
  const ownerEarning = parseFloat(totalPrice ?? "0") - commission;

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("pending_balance")
    .eq("id", booking.owner_id)
    .single();

  await supabase.from("profiles").update({
    pending_balance: (ownerProfile?.pending_balance ?? 0) + ownerEarning,
  }).eq("id", booking.owner_id);
}
    }
  }

  if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session;
  const { bookingId, totalPrice, commission, listingId, plan, days } = session.metadata ?? {};

  // Paiement de reservation
  if (bookingId) {
    await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_intent_id: session.payment_intent as string,
      })
      .eq("id", bookingId);

    const { data: booking } = await supabase
      .from("bookings")
      .select("owner_id, total_price")
      .eq("id", bookingId)
      .single();

    if (booking) {
      const commissionAmount = Math.round(parseFloat(totalPrice ?? "0") * 0.12 / 1.12);
      const ownerEarning = parseFloat(totalPrice ?? "0") - commissionAmount;

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("pending_balance")
        .eq("id", booking.owner_id)
        .single();

      await supabase.from("profiles").update({
        pending_balance: (ownerProfile?.pending_balance ?? 0) + ownerEarning,
      }).eq("id", booking.owner_id);
    }
  }

  // Paiement de sponsoring
  if (listingId && days) {
    const until = new Date();
    until.setDate(until.getDate() + parseInt(days));

    await supabase.from("listings").update({
      is_sponsored: true,
      sponsored_until: until.toISOString(),
    }).eq("id", listingId);
  }
}

  return NextResponse.json({ received: true });
}