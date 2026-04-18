"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  city: string;
  price_per_day: number;
  deposit_amount: number;
  owner_id: string;
  listing_photos?: { url: string }[];
};

const COMMISSION_RATE = 0.12;

export default function BookListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [renterProfile, setRenterProfile] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      if (profile) setRenterProfile(profile);
    });
  }, []);

  useEffect(() => {
    async function fetchListing() {
      const { data } = await supabase
        .from("listings")
        .select("*, listing_photos(url, sort_order)")
        .eq("id", id)
        .single();

      if (data) {
        setListing(data);
        const { data: owner } = await supabase.from("profiles").select("*").eq("id", data.owner_id).single();
        if (owner) setOwnerProfile(owner);
      }
      setLoading(false);
    }
    fetchListing();
  }, [id]);

  function calculateDays() {
    if (!startDate) return 0;
    if (!endDate || endDate === startDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }

  const days = calculateDays();
  const basePrice = days * (listing?.price_per_day ?? 0);
  const commission = Math.round(basePrice * COMMISSION_RATE);
  const totalPrice = basePrice + commission;

  async function generatePDF(bId: string) {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const startF = new Date(startDate).toLocaleDateString("fr-FR");
    const endF = new Date(endDate).toLocaleDateString("fr-FR");
    const today = new Date().toLocaleDateString("fr-FR");
    const paymentStatus = isPaid ? "Paiement déjà effectué" : "Paiement à régler sur place";

    doc.setFillColor(124, 58, 189);
    doc.rect(0, 0, 210, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("LUXORA", 20, 22);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Plateforme de location entre particuliers", 20, 32);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRAT DE LOCATION", 190, 22, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Réf : ${bId.slice(0, 8).toUpperCase()}`, 190, 30, { align: "right" });
    doc.text(`Date : ${today}`, 190, 38, { align: "right" });

    doc.setTextColor(30, 30, 30);

    doc.setFillColor(245, 243, 255);
    doc.rect(0, 45, 210, 12, "F");
    doc.setTextColor(124, 58, 189);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Statut : En attente de confirmation  •  Paiement : ${paymentStatus}`, 105, 53, { align: "center" });

    doc.setTextColor(30, 30, 30);

    doc.setFillColor(249, 250, 251);
    doc.rect(14, 62, 85, 52, "F");
    doc.rect(111, 62, 85, 52, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(124, 58, 189);
    doc.text("LOUEUR", 20, 71);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(ownerProfile?.full_name ?? ownerProfile?.username ?? "Non renseigne", 20, 80);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(ownerProfile?.email ?? "Non renseigne", 20, 88);
    doc.text(`@${ownerProfile?.username ?? "—"}`, 20, 96);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(124, 58, 189);
    doc.text("LOCATAIRE", 117, 71);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(renterProfile?.full_name ?? renterProfile?.username ?? "Non renseigne", 117, 80);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(user?.email ?? "Non renseigne", 117, 88);
    doc.text(`@${renterProfile?.username ?? "—"}`, 117, 96);

    doc.setTextColor(30, 30, 30);

    doc.setFillColor(124, 58, 189);
    doc.rect(14, 120, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("BIEN LOUÉ", 20, 126);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Article : ${listing?.title ?? ""}`, 20, 137);
    doc.text(`Ville : ${listing?.city ?? ""}`, 20, 145);

    doc.setFillColor(124, 58, 189);
    doc.rect(14, 155, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("PÉRIODE DE LOCATION", 20, 161);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);

    doc.setFillColor(245, 243, 255);
    doc.rect(14, 167, 58, 20, "F");
    doc.rect(76, 167, 58, 20, "F");
    doc.rect(138, 167, 58, 20, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(124, 58, 189);
    doc.text("DATE DE DÉBUT", 43, 174, { align: "center" });
    doc.text("DATE DE FIN", 105, 174, { align: "center" });
    doc.text("DURÉE", 167, 174, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(startF, 43, 183, { align: "center" });
    doc.text(endF, 105, 183, { align: "center" });
    doc.text(`${days} jour${days > 1 ? "s" : ""}`, 167, 183, { align: "center" });

    doc.setFillColor(124, 58, 189);
    doc.rect(14, 194, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CONDITIONS FINANCIÈRES", 20, 200);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`Prix de la location (${days} jour${days > 1 ? "s" : ""})`, 20, 212);
    doc.text(`${basePrice} €`, 190, 212, { align: "right" });

    doc.setDrawColor(220, 220, 220);
    doc.line(20, 216, 190, 216);

    doc.text(`Frais de service Luxora (12%)`, 20, 223);
    doc.text(`${commission} €`, 190, 223, { align: "right" });

    doc.line(20, 227, 190, 227);

    doc.text(`Caution`, 20, 234);
    doc.text(`${listing?.deposit_amount} €`, 190, 234, { align: "right" });

    doc.line(20, 238, 190, 238);

    doc.setFillColor(124, 58, 189);
    doc.rect(14, 241, 182, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("MONTANT TOTAL À PAYER", 20, 249);
    doc.text(`${totalPrice} €`, 190, 249, { align: "right" });

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("SIGNATURES", 105, 265, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 280, 85, 280);
    doc.line(120, 280, 190, 280);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Signature du loueur", 52, 286, { align: "center" });
    doc.text("Signature du locataire", 155, 286, { align: "center" });

    doc.setFillColor(124, 58, 189);
    doc.rect(0, 290, 210, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("Luxora — Plateforme de location entre particuliers — luxora.app", 105, 296, { align: "center" });

    doc.save(`contrat-luxora-${bId.slice(0, 8)}.pdf`);
  }

  async function handleSubmit() {
    setError("");

    if (!startDate || !endDate) {
      setError("Merci de choisir des dates.");
      return;
    }

    if (endDate && endDate < startDate) {
  setError("La date de fin doit être après la date de début.");
  return;
}

    if (!user || !listing) return;

    if (user.id === listing.owner_id) {
      setError("Tu ne peux pas réserver ta propre annonce.");
      return;
    }

    setSubmitting(true);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        listing_id: id,
        owner_id: listing.owner_id,
        renter_id: user.id,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        status: "pending",
        message: message.trim() || null,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      setError("Erreur lors de la réservation. Reessaie.");
      setSubmitting(false);
      return;
    }

    setBookingId(booking.id);

    const paymentText = isPaid
      ? "Le paiement a déjà été effectué."
      : "Le paiement est à régler sur place.";

    const startF = new Date(startDate).toLocaleDateString("fr-FR");
    const endF = new Date(endDate).toLocaleDateString("fr-FR");

    const autoMessage = `"${listing.title}" est louée du ${startF} au ${endF} pour un montant de ${totalPrice} € (dont ${commission} € de frais de service Luxora). ${paymentText}`;

    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        listing_id: id,
        owner_id: listing.owner_id,
        renter_id: user.id,
      })
      .select()
      .single();

    if (newConv) {
      await supabase.from("messages").insert({
        conversation_id: newConv.id,
        sender_id: user.id,
        content: autoMessage,
      });
    }
// Email au loueur
await fetch("/api/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "new_booking",
    to: ownerProfile?.email,
    data: {
      listing_title: listing.title,
      renter_name: renterProfile?.full_name ?? renterProfile?.username ?? user.email,
      start_date: new Date(startDate).toLocaleDateString("fr-FR"),
      end_date: new Date(endDate).toLocaleDateString("fr-FR"),
      total_price: totalPrice,
    },
  }),
});

// Email au locataire
await fetch("/api/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "booking_confirmation",
    to: user.email,
    data: {
      listing_title: listing.title,
      listing_city: listing.city,
      start_date: new Date(startDate).toLocaleDateString("fr-FR"),
      end_date: new Date(endDate).toLocaleDateString("fr-FR"),
      base_price: basePrice,
      commission: commission,
      total_price: totalPrice,
    },
  }),
});
    await generatePDF(booking.id);

    setSuccess(true);
    setSubmitting(false);
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-900 caret-gray-900";

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        </nav>
        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="bg-gray-100 rounded-2xl h-32 animate-pulse" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="text-xl font-medium text-gray-900 mb-2">Réservation envoyée !</h1>
        <p className="text-sm text-gray-500 text-center mb-2">Le loueur a été notifié dans sa messagerie.</p>
        <p className="text-sm text-gray-500 text-center mb-6">Le contrat PDF a été téléchargé automatiquement.</p>
        {bookingId && (
          <button
            onClick={() => generatePDF(bookingId)}
            className="mb-4 px-6 py-2.5 border border-purple-200 text-purple-700 text-sm font-medium rounded-xl hover:bg-purple-50 transition-colors"
          >
            Retélécharger le contrat
          </button>
        )}
        <div className="flex gap-3">
          <Link href="/messages" className="px-6 py-2.5 bg-purple-700 text-white text-sm font-medium rounded-xl hover:bg-purple-800 transition-colors">
            Voir mes messages
          </Link>
          <Link href="/" className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">

      <nav className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900">Retour</button>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">Réserver</h1>

        {listing && (
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 mb-6">
            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {listing.listing_photos?.[0]?.url ? (
                <img src={listing.listing_photos[0].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-300 text-xs">—</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
              <p className="text-xs text-gray-400">{listing.city}</p>
              <p className="text-sm font-medium text-purple-700">{listing.price_per_day} €/jour</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5">

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-1">Date de début *</label>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
  <label className="block text-sm font-medium text-gray-900 mb-1">Date de fin (optionnel)</label>
  <input
    type="date"
    value={endDate}
    min={startDate || new Date().toISOString().split("T")[0]}
    onChange={(e) => setEndDate(e.target.value)}
    className={inputClass}
  />
  <p className="text-xs text-gray-400 mt-1">Laisse vide pour une seule journée</p>
</div>
          </div>

          {days > 0 && (
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>{listing?.price_per_day} € x {days} jour{days > 1 ? "s" : ""}</span>
                <span>{basePrice} €</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>Frais de service </span>
                <span>{commission} €</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>Caution</span>
                <span>{listing?.deposit_amount} €</span>
              </div>
              <div className="border-t border-purple-100 pt-2 flex justify-between font-medium text-gray-900">
                <span>Total à payer</span>
                <span>{totalPrice} €</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <input
              type="checkbox"
              id="paid"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="accent-purple-700 w-4 h-4"
            />
            <label htmlFor="paid" className="text-sm text-gray-900 cursor-pointer">
              J'ai déjà effectué le paiement
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Message au loueur (optionnel)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présente-toi et explique l'usage prévu..."
              rows={3}
              className={inputClass + " resize-none placeholder:text-gray-900"}
            />
          </div>

          <div className="bg-purple-50 rounded-xl p-4 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p className="text-xs text-purple-700">Un contrat de location PDF sera généré et téléchargé automatiquement lors de la réservation.</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50"
          >
            {submitting ? "Génération du contrat..." : "Confirmer la réservation"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Le loueur devra confirmer ta demande avant que la réservation soit validée.
          </p>

        </div>
      </div>
    </div>
  );
}
