"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Listing = {
  id: string;
  title: string;
  city: string;
  category: string;
  price_per_day: number;
  deposit_amount: number;
  owner_id: string;
  requires_verification: boolean;
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
    const paymentStatus = isPaid ? "Paiement deja effectue" : "Paiement a regler sur place";
    const refNumber = bId.slice(0, 8).toUpperCase();

    // Header violet
    doc.setFillColor(124, 58, 189);
    doc.rect(0, 0, 210, 42, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("Luxor-A", 20, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Plateforme de location entre particuliers", 20, 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("CONTRAT DE LOCATION", 190, 18, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Ref : ${refNumber}`, 190, 26, { align: "right" });
    doc.text(`Date d emission : ${today}`, 190, 33, { align: "right" });

    // Bandeau statut
    doc.setFillColor(237, 233, 254);
    doc.rect(0, 42, 210, 10, "F");
    doc.setTextColor(124, 58, 189);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Statut : En attente de confirmation  -  ${paymentStatus}`, 105, 49, { align: "center" });

    // Section PARTIES
    doc.setTextColor(30, 30, 30);
    doc.setFillColor(249, 250, 251);
    doc.rect(14, 58, 85, 55, "F");
    doc.rect(111, 58, 85, 55, "F");

    doc.setDrawColor(124, 58, 189);
    doc.setLineWidth(0.3);
    doc.rect(14, 58, 85, 55);
    doc.rect(111, 58, 85, 55);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(124, 58, 189);
    doc.text("LOUEUR", 20, 66);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(ownerProfile?.full_name ?? ownerProfile?.username ?? "Non renseigne", 20, 74);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(ownerProfile?.email ?? "Non renseigne", 20, 81);
    doc.text(`@${ownerProfile?.username ?? "-"}`, 20, 88);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(124, 58, 189);
    doc.text("LOCATAIRE", 117, 66);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(renterProfile?.full_name ?? renterProfile?.username ?? "Non renseigne", 117, 74);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(user?.email ?? "Non renseigne", 117, 81);
    doc.text(`@${renterProfile?.username ?? "-"}`, 117, 88);

    // Section BIEN LOUE
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(124, 58, 189);
    doc.rect(14, 120, 182, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("BIEN LOUE", 20, 126);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Article : ${listing?.title ?? ""}`, 20, 136);
    doc.text(`Ville : ${listing?.city ?? ""}`, 20, 143);
    doc.text(`Categorie : ${listing?.category ?? ""}`, 20, 150);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("L article doit etre restitue dans le meme etat qu a la remise.", 20, 157);

    // Section PERIODE
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(124, 58, 189);
    doc.rect(14, 163, 182, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("PERIODE DE LOCATION", 20, 169);

    doc.setFillColor(237, 233, 254);
    doc.rect(14, 173, 58, 18, "F");
    doc.rect(76, 173, 58, 18, "F");
    doc.rect(138, 173, 58, 18, "F");

    doc.setTextColor(124, 58, 189);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("DATE DE DEBUT", 43, 179, { align: "center" });
    doc.text("DATE DE FIN", 105, 179, { align: "center" });
    doc.text("DUREE TOTALE", 167, 179, { align: "center" });

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(startF, 43, 188, { align: "center" });
    doc.text(endF, 105, 188, { align: "center" });
    doc.text(`${days} jour${days > 1 ? "s" : ""}`, 167, 188, { align: "center" });

    // Section FINANCES
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(124, 58, 189);
    doc.rect(14, 197, 182, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("CONDITIONS FINANCIERES", 20, 203);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(`Prix de base (${days} jour${days > 1 ? "s" : ""} x ${listing?.price_per_day} euros)`, 20, 213);
    doc.text(`${basePrice} euros`, 190, 213, { align: "right" });

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(20, 216, 190, 216);

    doc.text("Frais de service Luxor-A (12%)", 20, 221);
    doc.text(`${commission} euros`, 190, 221, { align: "right" });

    doc.line(20, 224, 190, 224);

    doc.text("Caution (remboursable a la restitution)", 20, 229);
    doc.text(`${listing?.deposit_amount} euros`, 190, 229, { align: "right" });

    doc.setLineWidth(0.5);
    doc.line(20, 233, 190, 233);

    doc.setFillColor(124, 58, 189);
    doc.rect(14, 235, 182, 11, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("MONTANT TOTAL A PAYER", 20, 242);
    doc.text(`${totalPrice} euros`, 190, 242, { align: "right" });

    // Conditions generales
    doc.setTextColor(124, 58, 189);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("CONDITIONS GENERALES", 20, 253);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    const conditions = [
      "1. Le locataire s engage a utiliser l article conformement a sa destination et a le restituer en bon etat.",
      "2. En cas de dommage, le locataire est responsable des frais de reparation ou de remplacement.",
      "3. La caution sera restituee sous 48h apres verification de l etat de l article.",
      "4. Toute annulation moins de 24h avant la location entraine des frais de 50% du montant total.",
      "5. Luxor-A agit en qualite d intermediaire et ne peut etre tenu responsable des litiges entre parties.",
    ];
    conditions.forEach((line, i) => {
      doc.text(line, 20, 259 + i * 5);
    });

    // Signatures
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("SIGNATURES", 105, 288, { align: "center" });

    doc.setDrawColor(124, 58, 189);
    doc.setLineWidth(0.5);
    doc.line(20, 298, 80, 298);
    doc.line(125, 298, 190, 298);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Signature du loueur", 50, 303, { align: "center" });
    doc.text("Signature du locataire", 157, 303, { align: "center" });

    // Footer
    doc.setFillColor(124, 58, 189);
    doc.rect(0, 287, 210, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Luxor-A - Contrat N ${refNumber} - Genere le ${today} - Luxor-A.app`, 105, 294, { align: "center" });

    doc.save(`contrat-Luxor-A-${refNumber}.pdf`);
  }

  async function handleSubmit() {
    setError("");

    if (!startDate) {
      setError("Merci de choisir une date de debut.");
      return;
    }

    if (endDate && endDate < startDate) {
      setError("La date de fin doit etre apres la date de debut.");
      return;
    }

    if (!user || !listing) return;

    if (user.id === listing.owner_id) {
      setError("Tu ne peux pas reserver ta propre annonce.");
      return;
    }

    if (listing.requires_verification) {
      const { data: verif } = await supabase
        .from("identity_verifications")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!verif || verif.status !== "verified") {
        setError("Cette annonce requiert une verification d identite. Verifie ton identite dans ton profil avant de reserver.");
        return;
      }
    }

// Vérifie les réservations existantes
const { data: existingBookings } = await supabase
  .from("bookings")
  .select("start_date, end_date")
  .eq("listing_id", id)
  .in("status", ["pending", "confirmed"]);

if (existingBookings && existingBookings.length > 0) {
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);

  for (const booking of existingBookings) {
    const bStart = new Date(booking.start_date);
    const bEnd = new Date(booking.end_date);

    if (start <= bEnd && end >= bStart) {
      setError("Ces dates sont déjà réservées. Choisis d'autres dates.");
      setSubmitting(false);
      return;
    }
  }
}

// Vérifie les dates bloquées
const { data: blocked } = await supabase
  .from("blocked_dates")
  .select("date")
  .eq("listing_id", id);

if (blocked && blocked.length > 0) {
  const blockedDates = blocked.map((b: any) => b.date);
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    if (blockedDates.includes(dateStr)) {
      setError(`La date du ${new Date(dateStr).toLocaleDateString("fr-FR")} n'est pas disponible.`);
      setSubmitting(false);
      return;
    }
  }
}

    setSubmitting(true);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        listing_id: id,
        owner_id: listing.owner_id,
        renter_id: user.id,
        start_date: startDate,
        end_date: endDate || startDate,
        total_price: totalPrice,
        status: "pending",
        message: message.trim() || null,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      setError("Erreur lors de la reservation. Reessaie.");
      setSubmitting(false);
      return;
    }

    setBookingId(booking.id);

    const paymentText = isPaid ? "Le paiement a deja ete effectue." : "Le paiement est a regler sur place.";
    const startF = new Date(startDate).toLocaleDateString("fr-FR");
    const endF = new Date(endDate || startDate).toLocaleDateString("fr-FR");
    const autoMessage = `"${listing.title}" est louee du ${startF} au ${endF} pour un montant de ${totalPrice} euros (dont ${commission} euros de frais de service Luxor-A). ${paymentText}`;

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
          end_date: new Date(endDate || startDate).toLocaleDateString("fr-FR"),
          total_price: totalPrice,
        },
      }),
    });

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
          end_date: new Date(endDate || startDate).toLocaleDateString("fr-FR"),
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
        <Navbar />
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
        <h1 className="text-xl font-medium text-gray-900 mb-2">Reservation envoyee !</h1>
        <p className="text-sm text-gray-500 text-center mb-2">Le loueur a ete notifie dans sa messagerie.</p>
        <p className="text-sm text-gray-500 text-center mb-6">Le contrat PDF a ete telecharge automatiquement.</p>
        {bookingId && (
          <button
            onClick={() => generatePDF(bookingId)}
            className="mb-4 px-6 py-2.5 border border-purple-200 text-purple-700 text-sm font-medium rounded-xl hover:bg-purple-50 transition-colors"
          >
            Retelecharger le contrat
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

      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">Reserver</h1>

        {listing && (
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 mb-6">
            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {listing.listing_photos?.[0]?.url ? (
                <img src={listing.listing_photos[0].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-300 text-xs">-</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
              <p className="text-xs text-gray-400">{listing.city}</p>
              <p className="text-sm font-medium text-purple-700">{listing.price_per_day} euros/jour</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5">

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-1">Date de debut *</label>
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
              <p className="text-xs text-gray-400 mt-1">Laisse vide pour une seule journee</p>
            </div>
          </div>

          {days > 0 && (
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>{listing?.price_per_day} euros x {days} jour{days > 1 ? "s" : ""}</span>
                <span>{basePrice} euros</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>Frais de service</span>
                <span>{commission} euros</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>Caution</span>
                <span>{listing?.deposit_amount} euros</span>
              </div>
              <div className="border-t border-purple-100 pt-2 flex justify-between font-medium text-gray-900">
                <span>Total a payer</span>
                <span>{totalPrice} euros</span>
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
              J ai deja effectue le paiement
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Message au loueur (optionnel)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Presente-toi et explique l usage prevu..."
              rows={3}
              className={inputClass + " resize-none placeholder:text-gray-900"}
            />
          </div>

          <div className="bg-purple-50 rounded-xl p-4 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p className="text-xs text-purple-700">Un contrat de location PDF sera genere et telecharge automatiquement lors de la reservation.</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50"
          >
            {submitting ? "Generation du contrat..." : "Confirmer la reservation"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Le loueur devra confirmer ta demande avant que la reservation soit validee.
          </p>

        </div>
      </div>
    </div>
  );
}
