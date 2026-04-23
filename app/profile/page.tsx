"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useEffect, useState, useRef } from "react";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating: number;
  rating_count: number;
  email: string | null;
  balance: number;
  referral_code: string | null;
};

type Listing = {
  id: string;
  title: string;
  city: string;
  price_per_day: number;
  category: string;
  listing_photos?: { url: string }[];
};

type Booking = {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
    city: string;
    listing_photos?: { url: string }[];
  };
  renter?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
};

function SelfieCamera({ onCapture }: { onCapture: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreaming(true);
        }
      })
      .catch(() => setError("Impossible d'accéder à la caméra."));

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  function capture() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        onCapture(file);
        (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
      }
    }, "image/jpeg", 0.9);
  }

  if (error) return <p className="text-sm text-red-500 text-center">{error}</p>;

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-900 relative">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {!streaming && <div className="absolute inset-0 flex items-center justify-center"><p className="text-white text-xs">Chargement caméra...</p></div>}
      </div>
      <button
        onClick={capture}
        disabled={!streaming}
        className="px-6 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-medium hover:bg-purple-800 disabled:opacity-50"
      >
        📸 Prendre la photo
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [receivedBookings, setReceivedBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"annonces" | "locations" | "mises-en-location" | "portefeuille">("annonces");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [iban, setIban] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState<"cni" | "passport" | "permis">("cni");
  const [showVerifModal, setShowVerifModal] = useState(false);
  const [verifSuccess, setVerifSuccess] = useState(false);
  const [verifStep, setVerifStep] = useState<"doc" | "selfie">("doc");
  const [docRecto, setDocRecto] = useState<File | null>(null);
  const [docVerso, setDocVerso] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    bio: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);
      fetchProfile(data.user.id);
      fetchListings(data.user.id);
      fetchBookings(data.user.id);
      fetchTransactions(data.user.id);
    });
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setProfile(data);
      setForm({ username: data.username ?? "", full_name: data.full_name ?? "", bio: data.bio ?? "" });
    }
    const { data: verif } = await supabase
      .from("identity_verifications")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setVerification(verif ?? null);
    setLoading(false);
  }

  async function fetchListings(userId: string) {
    const { data } = await supabase
      .from("listings")
      .select("*, listing_photos(url, sort_order)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (data) setListings(data);
  }

  async function fetchBookings(userId: string) {
    const { data: asRenter } = await supabase
      .from("bookings")
      .select("*, listing:listings(id, title, city, listing_photos(url, sort_order))")
      .eq("renter_id", userId)
      .order("start_date", { ascending: false });
    if (asRenter) setMyBookings(asRenter);

    const { data: asOwner } = await supabase
      .from("bookings")
      .select("*, listing:listings(id, title, city, listing_photos(url, sort_order)), renter:profiles!bookings_renter_id_fkey(username, full_name, avatar_url)")
      .eq("owner_id", userId)
      .order("start_date", { ascending: false });
    if (asOwner) setReceivedBookings(asOwner);
  }

  async function fetchTransactions(userId: string) {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setTransactions(data);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");

    if (form.username) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", form.username)
        .neq("id", user.id)
        .maybeSingle();

      if (existing) {
        setError("Ce nom d'utilisateur est déjà pris. Choisis-en un autre.");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: form.username,
      full_name: form.full_name,
      bio: form.bio,
    });

    if (error) { setError("Erreur lors de la sauvegarde."); }
    else { setSuccess("Profil mis a jour !"); setEditing(false); fetchProfile(user.id); }
    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").upsert({ id: user.id, avatar_url: urlData.publicUrl });
      fetchProfile(user.id);
    }
    setUploadingAvatar(false);
  }

  async function handleDeleteListing(id: string) {
    await supabase.from("listing_photos").delete().eq("listing_id", id);
    await supabase.from("favorites").delete().eq("listing_id", id);
    await supabase.from("conversations").delete().eq("listing_id", id);
    await supabase.from("listings").delete().eq("id", id);
    setListings(listings.filter((l) => l.id !== id));
    setConfirmDelete(null);
  }

  async function handleWithdraw() {
    setWithdrawError("");
    setWithdrawSuccess("");

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { setWithdrawError("Montant invalide."); return; }
    if (!iban.trim()) { setWithdrawError("Merci d'entrer ton IBAN."); return; }
    if (amount > (profile?.balance ?? 0)) { setWithdrawError("Solde insuffisant."); return; }

    const newBalance = (profile?.balance ?? 0) - amount;
    await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id);
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "withdrawal",
      amount: -amount,
      description: `Virement vers IBAN ${iban.slice(-4).padStart(iban.length, "*")}`,
    });

    setWithdrawSuccess(`Demande de virement de ${amount} € envoyée ! Le virement sera traité sous 3-5 jours ouvrés.`);
    setWithdrawAmount("");
    setIban("");
    setShowWithdraw(false);
    fetchProfile(user.id);
    fetchTransactions(user.id);
  }

  async function handleReview(bookingId: string) {
  if (!user) return;
  setReviewSubmitting(true);

  const booking = myBookings.find(b => b.id === bookingId);
  if (!booking) return;

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", user.id)
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existing) {
    setShowReviewModal(null);
    setReviewSubmitting(false);
    return;
  }

  await supabase.from("reviews").insert({
    reviewer_id: user.id,
    reviewed_id: booking.listing?.owner_id ?? "",
    listing_id: booking.listing?.id ?? "",
    rating: reviewRating,
    comment: reviewComment.trim() || null,
  });

  const { data: ownerReviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_id", booking.listing?.owner_id ?? "");

  if (ownerReviews && ownerReviews.length > 0) {
    const avg = ownerReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / ownerReviews.length;
    await supabase.from("profiles").update({
      rating: Math.round(avg * 10) / 10,
      rating_count: ownerReviews.length,
    }).eq("id", booking.listing?.owner_id ?? "");
  }

  setShowReviewModal(null);
  setReviewRating(5);
  setReviewComment("");
  setReviewSubmitting(false);
}

  async function handleRectoUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  setDocRecto(file);
}

async function handleVersoUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  setDocVerso(file);
}

async function handleSelfieUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  setSelfieFile(file);
}

async function submitVerification() {
  if (!user) return;
  setUploadingDoc(true);

  const needsVerso = docType === "cni" || docType === "permis";

  if (!docRecto || (needsVerso && !docVerso) || !selfieFile) {
    setUploadingDoc(false);
    return;
  }

// Supprime tous les anciens fichiers
const { data: existingFiles } = await supabase.storage
  .from("identity-documents")
  .list(user.id);

if (existingFiles && existingFiles.length > 0) {
  const filesToDelete = existingFiles.map((f: any) => `${user.id}/${f.name}`);
  await supabase.storage.from("identity-documents").remove(filesToDelete);
}

const ts = Date.now();

  const extRecto = docRecto.name.split(".").pop();
  const pathRecto = `${user.id}/recto-${ts}.${extRecto}`;
  await supabase.storage.from("identity-documents").upload(pathRecto, docRecto, { upsert: true });

  if (needsVerso && docVerso) {
    const extVerso = docVerso.name.split(".").pop();
    const pathVerso = `${user.id}/verso-${ts}.${extVerso}`;
    await supabase.storage.from("identity-documents").upload(pathVerso, docVerso, { upsert: true });
  }

  const extSelfie = selfieFile.name.split(".").pop();
  const pathSelfie = `${user.id}/selfie-${ts}.${extSelfie}`;
  await supabase.storage.from("identity-documents").upload(pathSelfie, selfieFile, { upsert: true });

  const { data: urlRecto } = supabase.storage.from("identity-documents").getPublicUrl(pathRecto);
const publicUrl = `${urlRecto.publicUrl}?t=${ts}`;

  await supabase.from("identity_verifications")
  .delete()
  .eq("user_id", user.id);

await supabase.from("identity_verifications").insert({
  user_id: user.id,
  document_type: docType,
  document_url: publicUrl,
  status: "pending",
});

  setVerification({ status: "pending", document_type: docType });
  setShowVerifModal(false);
  setVerifStep("doc");
  setDocRecto(null);
  setDocVerso(null);
  setSelfieFile(null);
  setVerifSuccess(true);
  setTimeout(() => setVerifSuccess(false), 5000);
  setUploadingDoc(false);
}

  function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? "#7C3AED" : "#E5E7EB", fontSize: 18 }}>★</span>
    ));
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR");
  }

  function getStatusLabel(status: string, startDate: string) {
    const now = new Date();
    const start = new Date(startDate);
    if (status === "cancelled") return { label: "Annulée", color: "bg-red-100 text-red-700" };
    if (status === "completed" || start < now) return { label: "Terminée", color: "bg-gray-100 text-gray-600" };
    return { label: "À venir", color: "bg-green-100 text-green-700" };
  }

  function isPaid(booking: Booking) {
    return booking.status === "completed" || booking.status === "confirmed";
  }

  function getTransactionIcon(type: string) {
    if (type === "earning") return { icon: "↑", color: "text-green-600", bg: "bg-green-100" };
    if (type === "spending") return { icon: "↓", color: "text-red-500", bg: "bg-red-100" };
    if (type === "withdrawal") return { icon: "→", color: "text-blue-600", bg: "bg-blue-100" };
    return { icon: "↺", color: "text-gray-600", bg: "bg-gray-100" };
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-900 text-gray-900 caret-gray-900";

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-gray-100 rounded-2xl h-32 animate-pulse mb-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">

      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Toast succès vérification */}
        {verifSuccess && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm px-6 py-3 rounded-full shadow-lg">
            Document envoyé ! Notre équipe vérifiera votre identité sous 24h.
          </div>
        )}

        {/* Avatar et infos */}
        <div className="flex items-start gap-6 mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden border border-gray-100">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-medium text-purple-700">
                  {profile?.username?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-6 h-6 bg-purple-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-800">
              <span className="text-white text-xs">+</span>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
            {uploadingAvatar && <p className="text-xs text-gray-400 mt-1">Upload...</p>}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-medium text-gray-900">{profile?.full_name || profile?.username || user?.email}</h1>
            {profile?.username && <p className="text-sm text-gray-400 mb-1">@{profile.username}</p>}
            <div className="flex items-center gap-2">
              <div className="flex">{renderStars(profile?.rating ?? 0)}</div>
              <span className="text-sm text-gray-400">{profile?.rating_count ?? 0} avis</span>
            </div>
            {profile?.bio && <p className="text-sm text-gray-600 mt-2">{profile.bio}</p>}
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm font-medium bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
          >
            {editing ? "Annuler" : "Modifier"}
          </button>
        </div>

        {/* Badge vérification identité */}
        <div className="mb-6">
          {verification?.status === "verified" && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 w-fit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-sm font-medium text-green-700">Identité vérifiée</span>
            </div>
          )}
          {verification?.status === "pending" && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 w-fit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span className="text-sm font-medium text-amber-700">Vérification en cours...</span>
            </div>
          )}
          {verification?.status === "rejected" && (
            <button
              onClick={() => setShowVerifModal(true)}
              className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 w-fit hover:bg-red-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <span className="text-sm font-medium text-red-700">Document rejeté — Réessayer</span>
            </button>
          )}
          {!verification && (
            <button
              onClick={() => setShowVerifModal(true)}
              className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 w-fit hover:bg-purple-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span className="text-sm font-medium text-purple-700">Vérifier mon identité</span>
            </button>
          )}
        </div>

        {/* Code parrainage */}
{profile?.referral_code && (
  <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-6">
    <p className="text-xs text-purple-500 mb-1">Ton code de parrainage</p>
    <div className="flex items-center gap-3">
      <p className="text-lg font-medium text-purple-800">{profile.referral_code}</p>
      <button
        onClick={() => {
          navigator.clipboard.writeText(profile.referral_code ?? "");
          alert("Code copié !");
        }}
        className="text-xs text-purple-700 border border-purple-300 px-3 py-1 rounded-lg hover:bg-purple-100"
      >
        Copier
      </button>
    </div>
    <p className="text-xs text-purple-400 mt-1">Gagne 5 € pour chaque ami qui s'inscrit avec ton code !</p>
  </div>
)}

        {/* Formulaire modification */}
        {editing && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom d utilisateur</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.username}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setForm({ ...form, username: val });
                    setUsernameAvailable(null);
                    if (val.length < 3) return;
                    setCheckingUsername(true);
                    const { data } = await supabase
                      .from("profiles")
                      .select("id")
                      .eq("username", val)
                      .neq("id", user.id)
                      .maybeSingle();
                    setUsernameAvailable(!data);
                    setCheckingUsername(false);
                  }}
                  placeholder={profile?.username ?? "Ton nom d'utilisateur"}
                  className={inputClass}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername && <span className="text-xs text-gray-400">...</span>}
                  {!checkingUsername && usernameAvailable === true && <span className="text-green-500 text-lg">✓</span>}
                  {!checkingUsername && usernameAvailable === false && <span className="text-red-500 text-lg">✗</span>}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder={profile?.full_name ?? "Ton nom complet"} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder={profile?.bio ?? "Parle un peu de toi..."} rows={3} className={inputClass + " resize-none"} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50">
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-0 mb-6 border-b border-gray-100 overflow-x-auto" style={{scrollbarWidth:'none'}}>
          {[
            { key: "annonces", label: `Annonces (${listings.length})` },
            { key: "locations", label: `Locations (${myBookings.length})` },
            { key: "mises-en-location", label: `Reçues (${receivedBookings.length})` },
            { key: "portefeuille", label: `💰 ${(profile?.balance ?? 0).toFixed(2)} €` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.key
                  ? "border-purple-700 text-purple-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mes annonces */}
        {activeTab === "annonces" && (
          <div className="flex flex-col gap-3">
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm mb-4">Tu n as pas encore d annonce.</p>
                <Link href="/listings/new" className="text-sm font-medium bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors">
                  Publier une annonce
                </Link>
              </div>
            ) : (
              listings.map((listing) => {
                const photo = listing.listing_photos?.[0]?.url;
                return (
                  <div key={listing.id} className="flex items-center gap-4 border border-gray-100 rounded-xl p-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                      {photo ? <img src={photo} alt={listing.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-gray-300 text-xs">—</span></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                      <p className="text-xs text-gray-400">{listing.city}</p>
                      <p className="text-xs text-purple-700 font-medium">{listing.price_per_day} €/jour</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/listings/${listing.id}`} className="text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg">Voir</Link>
                      <button onClick={() => setConfirmDelete(listing.id)} className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-lg">Supprimer</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Mes locations */}
        {activeTab === "locations" && (
          <div className="flex flex-col gap-3">
            {myBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm mb-4">Tu n as pas encore effectué de location.</p>
                <Link href="/" className="text-sm font-medium bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors">
                  Parcourir les annonces
                </Link>
              </div>
            ) : (
              myBookings.map((booking) => {
                const photo = booking.listing?.listing_photos?.[0]?.url;
                const status = getStatusLabel(booking.status, booking.start_date);
                const paid = isPaid(booking);
                return (
                  <div key={booking.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                        {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-gray-300 text-xs">—</span></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{booking.listing?.title}</p>
                        <p className="text-xs text-gray-400">{booking.listing?.city}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Du {formatDate(booking.start_date)} au {formatDate(booking.end_date)}</span>
                      <span className="font-medium text-gray-900">{booking.total_price} €</span>
                    </div>
                    {!paid && (
                      <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span className="text-xs text-amber-700 font-medium">Paiement de {booking.total_price} € à régler</span>
                      </div>
                    )}
                   <div className="flex gap-2 mt-3">
  <Link href={`/listings/${booking.listing?.id}`} className="text-xs text-gray-500 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
    Voir l'annonce
  </Link>
  {status.label === "Terminée" && (
    <button
      onClick={() => setShowReviewModal(booking.id)}
      className="text-xs text-purple-700 px-3 py-1.5 border border-purple-200 rounded-lg hover:bg-purple-50"
    >
      ⭐ Laisser un avis
    </button>
  )}
</div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Locations reçues */}
        {activeTab === "mises-en-location" && (
          <div className="flex flex-col gap-3">
            {receivedBookings.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-12">Aucune réservation reçue pour le moment.</p>
            ) : (
              receivedBookings.map((booking) => {
                const photo = booking.listing?.listing_photos?.[0]?.url;
                const status = getStatusLabel(booking.status, booking.start_date);
                const paid = isPaid(booking);
                return (
                  <div key={booking.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                        {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-gray-300 text-xs">—</span></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{booking.listing?.title}</p>
                        <p className="text-xs text-gray-400">{booking.listing?.city}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {booking.renter?.avatar_url ? (
                          <img src={booking.renter.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-purple-700">{booking.renter?.username?.[0]?.toUpperCase() ?? "?"}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{booking.renter?.full_name ?? booking.renter?.username ?? "Locataire"}</p>
                        <p className="text-xs text-gray-400">Du {formatDate(booking.start_date)} au {formatDate(booking.end_date)}</p>
                      </div>
                      <span className="ml-auto text-sm font-medium text-purple-700">{booking.total_price} €</span>
                    </div>
                    {!paid && (
                      <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span className="text-xs text-amber-700 font-medium">Paiement de {booking.total_price} € en attente</span>
                      </div>
                    )}
                    {booking.status === "pending" && (
  <div className="flex gap-2 mt-3">
    <button
      onClick={async () => {
        await supabase.from("bookings").update({ status: "confirmed" }).eq("id", booking.id);
        setReceivedBookings(receivedBookings.map(b => b.id === booking.id ? { ...b, status: "confirmed" } : b));
      }}
      className="flex-1 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600"
    >
      ✓ Accepter
    </button>
    <button
      onClick={async () => {
        await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
        setReceivedBookings(receivedBookings.map(b => b.id === booking.id ? { ...b, status: "cancelled" } : b));
      }}
      className="flex-1 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600"
    >
      ✗ Refuser
    </button>
  </div>
)}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Portefeuille */}
        {activeTab === "portefeuille" && (
          <div className="flex flex-col gap-4">
            <div className="bg-purple-700 rounded-2xl p-6 text-white">
              <p className="text-sm text-purple-200 mb-1">Solde disponible</p>
              <p className="text-4xl font-medium mb-4">{(profile?.balance ?? 0).toFixed(2)} €</p>
              <button
                onClick={() => setShowWithdraw(true)}
                className="w-full py-2.5 bg-white text-purple-700 text-sm font-medium rounded-xl hover:bg-purple-50 transition-colors"
              >
                Retirer vers ma banque
              </button>
            </div>

            {withdrawSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700">{withdrawSuccess}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Historique des transactions</h3>
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Aucune transaction pour le moment.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {transactions.map((tx) => {
                    const style = getTransactionIcon(tx.type);
                    return (
                      <div key={tx.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                        <div className={`w-9 h-9 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-sm font-medium ${style.color}`}>{style.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{tx.description ?? tx.type}</p>
                          <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                        </div>
                        <p className={`text-sm font-medium ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)} €
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

{showReviewModal && (
  <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
      <h3 className="text-base font-medium text-gray-900 mb-2">Laisser un avis</h3>
      <p className="text-sm text-gray-500 mb-4">Note ton expérience avec ce loueur.</p>
      <div className="flex justify-center gap-2 mb-4">
        {[1,2,3,4,5].map((star) => (
          <button
            key={star}
            onClick={() => setReviewRating(star)}
            className="text-3xl transition-transform hover:scale-110"
          >
            <span style={{ color: star <= reviewRating ? "#7C3AED" : "#E5E7EB" }}>★</span>
          </button>
        ))}
      </div>
      <textarea
        value={reviewComment}
        onChange={(e) => setReviewComment(e.target.value)}
        placeholder="Partage ton expérience (optionnel)..."
        rows={3}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-900 resize-none mb-4"
      />
      <div className="flex gap-3">
        <button onClick={() => setShowReviewModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700">Annuler</button>
        <button
          onClick={() => handleReview(showReviewModal)}
          disabled={reviewSubmitting}
          className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-medium hover:bg-purple-800 disabled:opacity-50"
        >
          {reviewSubmitting ? "Envoi..." : "Publier"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Popup retrait */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-medium text-gray-900 mb-4">Retirer vers ma banque</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Montant (€)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max: ${(profile?.balance ?? 0).toFixed(2)} €`}
                  max={profile?.balance ?? 0}
                  min={1}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">IBAN</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-900"
                />
              </div>
              {withdrawError && <p className="text-sm text-red-500">{withdrawError}</p>}
              <p className="text-xs text-gray-400">Le virement sera traité sous 3 à 5 jours ouvrés.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowWithdraw(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
                <button onClick={handleWithdraw} className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-medium hover:bg-purple-800">Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup verification identite */}
      {showVerifModal && (
  <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
      <h3 className="text-base font-medium text-gray-900 mb-2">Vérifier mon identité</h3>

      {verifStep === "doc" && (
        <>
          <p className="text-sm text-gray-500 mb-4">Choisis ton document d'identité et uploade les photos.</p>
          <div className="flex flex-col gap-2 mb-4">
            {[
              { key: "cni", label: "🪪 Carte nationale d'identité" },
              { key: "passport", label: "📘 Passeport" },
              { key: "permis", label: "🚗 Permis de conduire" },
            ].map((doc) => (
              <button
                key={doc.key}
                onClick={() => setDocType(doc.key as any)}
                className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  docType === doc.key ? "border-purple-500 bg-purple-50 text-purple-800" : "border-gray-200 text-gray-700"
                }`}
              >
                {doc.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 mb-4">
            <label className={`w-full py-2.5 rounded-xl text-sm font-medium text-center cursor-pointer border transition-colors ${docRecto ? "bg-green-50 border-green-300 text-green-700" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"}`}>
              {docRecto ? "✓ Recto ajouté" : "📄 Photo recto"}
              <input type="file" accept="image/*" onChange={handleRectoUpload} className="hidden" />
            </label>
            {(docType === "cni" || docType === "permis") && (
              <label className={`w-full py-2.5 rounded-xl text-sm font-medium text-center cursor-pointer border transition-colors ${docVerso ? "bg-green-50 border-green-300 text-green-700" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"}`}>
                {docVerso ? "✓ Verso ajouté" : "📄 Photo verso"}
                <input type="file" accept="image/*" onChange={handleVersoUpload} className="hidden" />
              </label>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowVerifModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700">Annuler</button>
            <button
              onClick={() => setVerifStep("selfie")}
              disabled={!docRecto || ((docType === "cni" || docType === "permis") && !docVerso)}
              className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-medium hover:bg-purple-800 disabled:opacity-50"
            >
              Suivant →
            </button>
          </div>
        </>
      )}

      {verifStep === "selfie" && (
  <>
    <p className="text-sm text-gray-500 mb-4">Prends un selfie pour confirmer que c'est bien toi.</p>
    <div className="mb-4 flex flex-col items-center gap-3">
      {!selfieFile ? (
        <SelfieCamera onCapture={(file) => setSelfieFile(file)} />
      ) : (
        <div className="w-full">
          <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100 mb-2">
            <img src={URL.createObjectURL(selfieFile)} alt="selfie" className="w-full h-full object-cover" />
          </div>
          <button onClick={() => setSelfieFile(null)} className="text-xs text-purple-700 underline">Reprendre</button>
        </div>
      )}
    </div>
    <div className="flex gap-3">
      <button onClick={() => setVerifStep("doc")} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700">← Retour</button>
      <button
        onClick={submitVerification}
        disabled={!selfieFile || uploadingDoc}
        className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-medium hover:bg-purple-800 disabled:opacity-50"
      >
        {uploadingDoc ? "Envoi..." : "Envoyer"}
      </button>
    </div>
  </>
)}
    </div>
  </div>
)}

      {/* Popup confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-medium text-gray-900 mb-2">Supprimer l'annonce</h3>
            <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={() => handleDeleteListing(confirmDelete)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Barre navigation mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 z-40">
        <Link href="/" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className="text-xs text-gray-400">Accueil</span>
        </Link>
        <Link href="/favorites" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span className="text-xs text-gray-400">Favoris</span>
        </Link>
        <Link href="/listings/new" className="flex flex-col items-center gap-0.5 px-2 py-1">
          <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center -mt-6 shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <span className="text-xs text-gray-400 mt-1">Publier</span>
        </Link>
        <Link href="/messages" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span className="text-xs text-gray-400">Messages</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-purple-700"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span className="text-xs text-purple-700 font-medium">Profil</span>
        </Link>
      </div>
    </div>
  );
}
