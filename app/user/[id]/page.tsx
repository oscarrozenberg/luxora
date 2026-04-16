"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import Link from "next/link";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating: number;
  rating_count: number;
};

type Listing = {
  id: string;
  title: string;
  city: string;
  price_per_day: number;
  category: string;
  subcategory: string | null;
  listing_photos?: { url: string }[];
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { username: string | null; full_name: string | null; avatar_url: string | null };
};

const CATEGORY_COLORS: Record<string, string> = {
  "Immobilier": "bg-blue-100 text-blue-800",
  "Véhicules": "bg-amber-100 text-amber-800",
  "Vacances": "bg-teal-100 text-teal-800",
  "Mode": "bg-pink-100 text-pink-800",
  "Maison & Jardin": "bg-green-100 text-green-800",
  "Famille": "bg-purple-100 text-purple-800",
  "Électronique": "bg-gray-100 text-gray-800",
  "Loisirs": "bg-orange-100 text-orange-800",
  "Autres": "bg-gray-100 text-gray-700",
};

export default function UserProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileData) setProfile(profileData);

      const { data: listingData } = await supabase
        .from("listings")
        .select("*, listing_photos(url, sort_order)")
        .eq("owner_id", id)
        .order("created_at", { ascending: false });

      if (listingData) setListings(listingData);

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, reviewer:profiles!reviews_reviewer_id_fkey(username, full_name, avatar_url)")
        .eq("reviewed_id", id)
        .order("created_at", { ascending: false });

      if (reviewData) setReviews(reviewData);

      setLoading(false);
    }

    fetchData();
  }, [id]);

  useEffect(() => {
    async function checkReview() {
      if (!currentUser || !id) return;
      const { data } = await supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_id", currentUser.id)
        .eq("reviewed_id", id)
        .maybeSingle();
      setHasReviewed(!!data);
    }
    checkReview();
  }, [currentUser, id]);

  async function submitReview() {
    if (!currentUser || selectedRating === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      reviewer_id: currentUser.id,
      reviewed_id: id,
      rating: selectedRating,
      comment: comment.trim() || null,
    });

    if (!error) {
      // Mettre à jour la moyenne
      const newCount = (profile?.rating_count ?? 0) + 1;
      const newRating = ((profile?.rating ?? 0) * (profile?.rating_count ?? 0) + selectedRating) / newCount;

      await supabase.from("profiles").update({
        rating: Math.round(newRating * 10) / 10,
        rating_count: newCount,
      }).eq("id", id);

      setHasReviewed(true);
      setShowReviewForm(false);
      setReviewSuccess("Avis envoyé !");

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, reviewer:profiles!reviews_reviewer_id_fkey(username, full_name, avatar_url)")
        .eq("reviewed_id", id)
        .order("created_at", { ascending: false });

      if (reviewData) setReviews(reviewData);

      const { data: updatedProfile } = await supabase
        .from("profiles").select("*").eq("id", id).single();
      if (updatedProfile) setProfile(updatedProfile);
    }

    setSubmitting(false);
  }

  function renderStars(rating: number, size = 20) {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? "#7C3AED" : "#E5E7EB", fontSize: size }}>★</span>
    ));
  }

  function renderInteractiveStars() {
    return Array.from({ length: 5 }).map((_, i) => (
      <button
        key={i}
        onMouseEnter={() => setHoveredRating(i + 1)}
        onMouseLeave={() => setHoveredRating(0)}
        onClick={() => setSelectedRating(i + 1)}
        style={{ fontSize: 32, color: i < (hoveredRating || selectedRating) ? "#7C3AED" : "#E5E7EB" }}
      >
        ★
      </button>
    ));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        </nav>
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-gray-100 rounded-2xl h-32 animate-pulse mb-6" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser?.id === id;

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">

      <nav className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        <button onClick={() => window.history.back()} className="text-sm text-gray-500 hover:text-gray-900">Retour</button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Profil */}
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-medium text-purple-700">
                {profile.username?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-medium text-gray-900">
              {profile.full_name ?? profile.username ?? "Utilisateur"}
            </h1>
            {profile.username && (
              <p className="text-sm text-gray-400 mb-1">@{profile.username}</p>
            )}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex">{renderStars(profile.rating ?? 0)}</div>
              <span className="text-sm text-gray-400">{profile.rating_count ?? 0} avis</span>
            </div>
            {profile.bio && <p className="text-sm text-gray-600">{profile.bio}</p>}
          </div>

          <div className="text-right">
            <p className="text-2xl font-medium text-purple-700">{listings.length}</p>
            <p className="text-xs text-gray-400">annonce{listings.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Bouton laisser un avis */}
        {!isOwnProfile && currentUser && !hasReviewed && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="w-full py-2.5 mb-6 border border-purple-200 text-purple-700 text-sm font-medium rounded-xl hover:bg-purple-50 transition-colors"
          >
            Laisser un avis
          </button>
        )}

        {reviewSuccess && (
          <p className="text-sm text-green-600 text-center mb-4">{reviewSuccess}</p>
        )}

        {/* Formulaire avis */}
        {showReviewForm && (
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Votre note</h3>
            <div className="flex gap-1 mb-4">
              {renderInteractiveStars()}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Laisse un commentaire (optionnel)..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-900 text-gray-900 caret-gray-900 resize-none mb-3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={submitReview}
                disabled={submitting || selectedRating === 0}
                className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-medium hover:bg-purple-800 disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        )}

        {/* Annonces */}
        <div className="border-t border-gray-100 pt-6 mb-6">
          <h2 className="text-base font-medium text-gray-900 mb-4">Ses annonces</h2>
          {listings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune annonce pour le moment.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {listings.map((listing) => {
                const photo = listing.listing_photos?.[0]?.url;
                return (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                      <div className="h-32 bg-gray-50 relative flex items-center justify-center">
                        {photo ? (
                          <img src={photo} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-300 text-xs">Pas de photo</span>
                        )}
                        <span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-900 text-white">
                          {listing.subcategory ?? listing.category}
                        </span>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 truncate mb-0.5">{listing.title}</p>
                        <p className="text-xs text-gray-400 mb-1">{listing.city}</p>
                        <p className="text-xs font-medium text-purple-700">{listing.price_per_day} €/jour</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Avis */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-base font-medium text-gray-900 mb-4">Avis ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Aucun avis pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {review.reviewer?.avatar_url ? (
                        <img src={review.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-medium text-purple-700">
                          {review.reviewer?.username?.[0]?.toUpperCase() ?? "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {review.reviewer?.full_name ?? review.reviewer?.username ?? "Utilisateur"}
                      </p>
                      <div className="flex">{renderStars(review.rating, 14)}</div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barre navigation mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 z-50">
        <Link href="/" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="text-xs text-gray-400">Accueil</span>
        </Link>
        <Link href="/favorites" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span className="text-xs text-gray-400">Favoris</span>
        </Link>
        <Link href="/listings/new" className="flex flex-col items-center gap-0.5 px-2 py-1">
          <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center -mt-6 shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span className="text-xs text-gray-400 mt-1">Publier</span>
        </Link>
        <Link href="/messages" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="text-xs text-gray-400">Messages</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-xs text-gray-400">Profil</span>
        </Link>
      </div>
    </div>
  );
}
