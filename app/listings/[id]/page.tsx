"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  city: string;
  price_per_day: number;
  deposit_amount: number;
  owner_id: string;
  created_at: string;
};

type Photo = {
  id: string;
  url: string;
  sort_order: number;
};

type Owner = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  rating: number;
  rating_count: number;
  listing_count?: number;
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
  }, []);

  useEffect(() => {
    async function fetchListing() {
      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (listingError || !listingData) {
        router.push("/");
        return;
      }

      setListing(listingData);

      const { data: photoData } = await supabase
        .from("listing_photos")
        .select("*")
        .eq("listing_id", id)
        .order("sort_order", { ascending: true });

      if (photoData) setPhotos(photoData);

      const { data: ownerData } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, rating, rating_count")
        .eq("id", listingData.owner_id)
        .single();

      if (ownerData) {
        const { count } = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", listingData.owner_id);
        setOwner({ ...ownerData, listing_count: count ?? 0 });
      }

      setLoading(false);
    }

    fetchListing();
  }, [id]);

  useEffect(() => {
    async function checkFavorite() {
      if (!currentUser || !id) return;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("listing_id", id)
        .maybeSingle();
      setIsFavorite(!!data);
    }
    checkFavorite();
  }, [currentUser, id]);

  async function toggleFavorite() {
    if (!currentUser) { router.push("/auth"); return; }
    setFavLoading(true);
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", currentUser.id).eq("listing_id", id);
      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({ user_id: currentUser.id, listing_id: id });
      setIsFavorite(true);
    }
    setFavLoading(false);
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? "#7C3AED" : "#E5E7EB", fontSize: 16 }}>★</span>
    ));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        </nav>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-gray-100 rounded-2xl h-96 animate-pulse mb-6" />
          <div className="bg-gray-100 rounded h-8 w-2/3 animate-pulse mb-3" />
          <div className="bg-gray-100 rounded h-5 w-1/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const isOwner = currentUser?.id === listing.owner_id;

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">

      <nav className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "red" : "none"} stroke={isFavorite ? "red" : "currentColor"} strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="hidden md:inline">{isFavorite ? "Retirer" : "Favoris"}</span>
          </button>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900">Retour</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">

        <div className="rounded-2xl overflow-hidden bg-gray-50 h-72 md:h-96 flex items-center justify-center mb-4">
          {photos.length > 0 ? (
            <img src={photos[activePhoto].url} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-300 text-sm">Pas de photo</span>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 mb-6">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setActivePhoto(index)}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                  activePhoto === index ? "border-purple-500" : "border-transparent"
                }`}
              >
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex gap-2 mb-2 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-900 text-white">
                {listing.category}
              </span>
              {listing.subcategory && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-900">
                  {listing.subcategory}
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-medium text-gray-900 mb-1">{listing.title}</h1>
            <p className="text-gray-400 text-sm">{listing.city}</p>
          </div>
          <div className="text-right">
            <p className="text-xl md:text-2xl font-medium text-purple-700">{listing.price_per_day} €<span className="text-sm font-normal text-gray-400">/jour</span></p>
            <p className="text-xs md:text-sm text-gray-400">Caution : {listing.deposit_amount} €</p>
          </div>
        </div>

        {listing.description && (
          <div className="border-t border-gray-100 pt-6 mb-6">
            <h2 className="text-base font-medium text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{listing.description}</p>
          </div>
        )}

        {owner && !isOwner && (
          <div className="border-t border-gray-100 pt-6 mb-6">
            <h2 className="text-base font-medium text-gray-900 mb-4">Le loueur</h2>
            <Link href={`/user/${owner.id}`} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 hover:bg-purple-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {owner.avatar_url ? (
                  <img src={owner.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-medium text-purple-700">
                    {owner.username?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {owner.full_name ?? owner.username ?? "Utilisateur"}
                </p>
                {owner.username && (
                  <p className="text-xs text-gray-400 mb-1">@{owner.username}</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(owner.rating ?? 0)}</div>
                  <span className="text-xs text-gray-400">{owner.rating_count ?? 0} avis</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-purple-700">{owner.listing_count}</p>
                <p className="text-xs text-gray-400">annonce{(owner.listing_count ?? 0) > 1 ? "s" : ""}</p>
              </div>
            </Link>
          </div>
        )}

        <div className="border-t border-gray-100 pt-6">
          {isOwner ? (
            <Link
              href={`/listings/${listing.id}/edit`}
              className="block w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors text-center"
            >
              Modifier l'annonce
            </Link>
          ) : (
            <div className="flex flex-col gap-3">
  <button
    onClick={() => router.push(`/listings/${listing.id}/book`)}
    className="w-full py-3 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors"
  >
    Réserver
  </button>
  <button
    onClick={() => router.push(`/messages?listing=${listing.id}&owner=${listing.owner_id}`)}
    className="w-full py-3 bg-white text-purple-700 font-medium rounded-xl border border-purple-200 hover:bg-purple-50 transition-colors"
  >
    Contacter le loueur
  </button>
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
