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
  listing_photos?: { url: string }[];
};

const CATEGORY_LABELS: Record<string, string> = {
  bags: "Sacs",
  dresses: "Robes",
  jewelry: "Bijoux",
  shoes: "Chaussures",
  accessories: "Accessoires",
};

const CATEGORY_COLORS: Record<string, string> = {
  bags: "bg-purple-100 text-purple-800",
  dresses: "bg-pink-100 text-pink-800",
  jewelry: "bg-amber-100 text-amber-800",
  shoes: "bg-teal-100 text-teal-800",
  accessories: "bg-gray-100 text-gray-700",
};

export default function UserProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }

    fetchData();
  }, [id]);

  function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? "#7C3AED" : "#E5E7EB", fontSize: 20 }}>★</span>
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
          <div className="bg-gray-100 rounded h-8 w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-white">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Retour</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        <div className="flex items-center gap-6 mb-8">
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
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">{renderStars(profile.rating ?? 0)}</div>
              <span className="text-sm text-gray-400">{profile.rating_count ?? 0} avis</span>
            </div>
            {profile.bio && (
              <p className="text-sm text-gray-600">{profile.bio}</p>
            )}
          </div>

          <div className="text-right">
            <p className="text-2xl font-medium text-purple-700">{listings.length}</p>
            <p className="text-xs text-gray-400">annonce{listings.length > 1 ? "s" : ""} en ligne</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-base font-medium text-gray-900 mb-4">Ses annonces</h2>

          {listings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune annonce pour le moment.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {listings.map((listing) => {
                const photo = listing.listing_photos?.[0]?.url;
                const badgeClass = CATEGORY_COLORS[listing.category] ?? "bg-gray-100 text-gray-700";
                const label = CATEGORY_LABELS[listing.category] ?? listing.category;

                return (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors cursor-pointer">
                      <div className="h-36 bg-gray-50 relative flex items-center justify-center">
                        {photo ? (
                          <img src={photo} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-300 text-xs">Pas de photo</span>
                        )}
                        <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
                          {label}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate mb-0.5">{listing.title}</p>
                        <p className="text-xs text-gray-400 mb-1">{listing.city}</p>
                        <p className="text-sm font-medium text-purple-700">{listing.price_per_day} €/jour</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
