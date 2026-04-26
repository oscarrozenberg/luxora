import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

export async function POST(req: NextRequest) {
  try {
    // Recupere toutes les reservations payees dont la date de fin est passee depuis 48h
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, owner_id, total_price")
      .eq("payment_status", "paid")
      .eq("funds_released", false)
      .lte("end_date", cutoffDate.toISOString().split("T")[0]);

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ released: 0 });
    }

    let released = 0;

    for (const booking of bookings) {
      const commission = Math.round(booking.total_price * 0.12 / 1.12);
      const ownerEarning = booking.total_price - commission;

      // Recupere le profil du loueur
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("balance, pending_balance")
        .eq("id", booking.owner_id)
        .single();

      if (ownerProfile) {
        // Transfere de pending_balance vers balance
        await supabase.from("profiles").update({
          balance: (ownerProfile.balance ?? 0) + ownerEarning,
          pending_balance: Math.max(0, (ownerProfile.pending_balance ?? 0) - ownerEarning),
        }).eq("id", booking.owner_id);

        // Marque la reservation comme liberee
        await supabase.from("bookings").update({
          funds_released: true,
          payment_status: "released",
        }).eq("id", booking.id);

        // Ajoute la transaction
        await supabase.from("transactions").insert({
          user_id: booking.owner_id,
          type: "earning",
          amount: ownerEarning,
          description: "Fonds liberes automatiquement apres 48h",
          booking_id: booking.id,
        });

        released++;
      }
    }

    return NextResponse.json({ released });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Route GET pour Vercel Cron
export async function GET(req: NextRequest) {
  return POST(req);
}