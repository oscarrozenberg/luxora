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
    const { bookingId, totalPrice, commission } = session.metadata ?? {};

    if (bookingId) {
      // Met a jour le statut de la reservation
      await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);

      // Recupere la reservation pour crediter le loueur
      const { data: booking } = await supabase
        .from("bookings")
        .select("owner_id, renter_id, total_price")
        .eq("id", bookingId)
        .single();

      if (booking) {
        const ownerEarning = parseFloat(totalPrice ?? "0") - parseFloat(commission ?? "0");

        // Credite le portefeuille du loueur
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", booking.owner_id)
          .single();

        await supabase
          .from("profiles")
          .update({ balance: (ownerProfile?.balance ?? 0) + ownerEarning })
          .eq("id", booking.owner_id);

        // Ajoute la transaction
        await supabase.from("transactions").insert({
          user_id: booking.owner_id,
          type: "earning",
          amount: ownerEarning,
          description: `Paiement recu pour une location`,
          booking_id: bookingId,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}