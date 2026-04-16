"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  city: string;
  price_per_day: number;
  deposit_amount: number;
  listing_photos?: { url: string }[];
};

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);
      fetchFavorites(data.user.id);
    });
  }, []);

  async function fetchFavorites(userId: string) {
    const { data } = await supabase
      .from("favorites")
      .select("listing:listings(*, listing_photos(url, sort_order))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      const listings = data.map((f: any) => f.listing).filter(Boolean);
      setFavorites(listings);
    }
    setLoading(false);
  }

  async function removeFavorite(listingId: string) {
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);
    setFavorites(favorites.filter((f) => f.id !== listingId));
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">

      {/* Navbar desktop */}
      <nav className="hidden md:flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm text-gray-900 hover:text-gray-600">Accueil</Link>
          <Link href="/messages" className="text-sm text-gray-900 hover:text-gray-600">Messages</Link>
          <Link href="/profile" className="text-sm text-gray-900 hover:text-gray-600">Mon profil</Link>
        </div>
      </nav>

      {/* Header mobile */}
      <div className="md:hidden px-4 pt-6 pb-2">
        <h1 className="text-2xl font-medium text-gray-900">Mes favoris</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="hidden md:block text-2xl font-medium text-gray-900 mb-6">Mes favoris</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="bg-gray-100 rounded-xl h-56 animate-pulse" />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-4">Tu n as pas encore de favoris.</p>
            <Link href="/" className="text-sm font-medium bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors">
              Parcourir les annonces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {favorites.map((listing) => {
              const photo = listing.listing_photos?.[0]?.url;
              return (
                <div key={listing.id} className="relative">
                  <Link href={`/listings/${listing.id}`}>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors cursor-pointer">
                      <div className="h-36 bg-gray-50 relative flex items-center justify-center">
                        {photo ? (
                          <img src={photo} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-300 text-xs">Pas de photo</span>
                        )}
                        <span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-900 text-white">
                          {listing.subcategory ?? listing.category}
                        </span>
                      </div>
                      <div className="p-2 md:p-3">
                        <p className="text-xs md:text-sm font-medium text-gray-900 truncate mb-0.5">{listing.title}</p>
                        <p className="text-xs text-gray-400 mb-1">{listing.city}</p>
                        <p className="text-xs md:text-sm font-medium text-purple-700">{listing.price_per_day} €/jour</p>
                      </div>
                    </div>
                  </Link>
                  {/* Bouton supprimer favori */}
                  <button
                    onClick={() => removeFavorite(listing.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="red" stroke="red" strokeWidth="1.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Barre navigation mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 z-50">
        <Link href="/" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="text-xs text-gray-400">Accueil</span>
        </Link>
        <Link href="/favorites" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="red" stroke="red" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span className="text-xs text-red-500 font-medium">Favoris</span>
        </Link>
        <Link href="/listings/new" className="flex flex-col items-center gap-0.5 px-2 py-1">
          <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center -mt-6 shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span className="text-xs text-gray-400 mt-1">Publier</span>
        </Link>
        <Link href="/messages" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="text-xs text-gray-400">Messages</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-xs text-gray-400">Profil</span>
        </Link>
      </div>
    </div>
  );
}
