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
    <div className="min-h-screen bg-white">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
          Retour aux annonces
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="rounded-2xl overflow-hidden bg-gray-50 h-96 flex items-center justify-center mb-4">
          {photos.length > 0 ? (
            <img
              src={photos[activePhoto].url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-300 text-sm">Pas de photo</span>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 mb-8">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setActivePhoto(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
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
            <div className="flex gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-900 text-white">
                {listing.category}
              </span>
              {listing.subcategory && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-900">
                  {listing.subcategory}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mb-1">{listing.title}</h1>
            <p className="text-gray-400 text-sm">{listing.city}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium text-purple-700">{listing.price_per_day} €<span className="text-base font-normal text-gray-400">/jour</span></p>
            <p className="text-sm text-gray-400">Caution : {listing.deposit_amount} €</p>
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
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {owner.avatar_url ? (
                  <img src={owner.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-medium text-purple-700">
                    {owner.username?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
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
                <p className="text-xs text-gray-400">annonce{(owner.listing_count ?? 0) > 1 ? "s" : ""} en ligne</p>
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
            <button
              onClick={() => router.push(`/messages?listing=${listing.id}&owner=${listing.owner_id}`)}
              className="w-full py-3 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors"
            >
              Contacter le loueur
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
