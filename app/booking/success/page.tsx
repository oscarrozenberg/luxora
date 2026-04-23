"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) return;
    supabase
      .from("bookings")
      .select("*, listing:listings(title, city)")
      .eq("id", bookingId)
      .single()
      .then(({ data }) => { if (data) setBooking(data); });
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 className="text-2xl font-medium text-gray-900 mb-2">Paiement confirmé !</h1>
        <p className="text-gray-500 text-sm mb-6">
          Ton paiement a bien été reçu. Le loueur a été notifié et ta réservation est confirmée.
        </p>

        {booking && (
          <div className="bg-purple-50 rounded-xl p-4 w-full mb-6 text-left">
            <p className="text-sm font-medium text-gray-900 mb-1">{booking.listing?.title}</p>
            <p className="text-xs text-gray-400 mb-2">{booking.listing?.city}</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Montant payé</span>
              <span className="font-medium text-purple-700">{booking.total_price} €</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <Link href="/messages" className="flex-1 py-3 bg-purple-700 text-white text-sm font-medium rounded-xl hover:bg-purple-800 transition-colors text-center">
            Voir mes messages
          </Link>
          <Link href="/profile" className="flex-1 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors text-center">
            Mon profil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-400">Chargement...</p></div>}>
      <BookingSuccessContent />
    </Suspense>
  );
}
