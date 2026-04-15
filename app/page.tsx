"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  city: string;
  price_per_day: number;
  deposit_amount: number;
  owner_id: string;
  created_at: string;
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

const CATEGORIES = ["all", "bags", "dresses", "jewelry", "shoes", "accessories"];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_photos(url, sort_order)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setListings(data);
        setFiltered(data);
      }
      setLoading(false);
    }
    fetchListings();
  }, []);

  useEffect(() => {
    let result = listings;

    if (activeCategory !== "all") {
      result = result.filter((l) => l.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [activeCategory, search, listings]);

  return (
    <div className="min-h-screen bg-white">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="text-xl font-medium tracking-widest text-gray-900">Luxora</span>
        <div className="flex items-center gap-6">
          <Link href="/listings" className="text-sm text-gray-500 hover:text-gray-900">
            Parcourir
          </Link>
          <Link href="/how-it-works" className="text-sm text-gray-500 hover:text-gray-900">
            Comment ca marche
          </Link>
          <Link
            href="/listings/new"
            className="text-sm font-medium bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
          >
            Publier une annonce
          </Link>
        </div>
      </nav>

      <section className="text-center px-6 py-16">
        <h1 className="text-4xl font-medium text-gray-900 mb-3 leading-tight">
          Louez la mode de luxe<br />entre particuliers
        </h1>
        <p className="text-gray-500 text-base mb-8">
          Sacs, robes, bijoux — portez l extraordinaire, sans l acheter.
        </p>
        <div className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Ville, article, marque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-900 text-gray-900 caret-gray-900"
          />
          <button className="px-5 py-2.5 bg-purple-700 text-white text-sm font-medium rounded-lg hover:bg-purple-800 transition-colors">
            Rechercher
          </button>
        </div>
      </section>

      <div className="flex gap-2 px-6 pb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
              activeCategory === cat
                ? "bg-purple-100 text-purple-800 border-purple-300"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {cat === "all" ? "Tout" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <section className="px-6 pb-16">
        <h2 className="text-base font-medium text-gray-900 mb-4">Annonces recentes</h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center">Aucune annonce trouvee.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((listing) => {
              const photo = listing.listing_photos?.[0]?.url;
              const badgeClass = CATEGORY_COLORS[listing.category] ?? "bg-gray-100 text-gray-700";
              const label = CATEGORY_LABELS[listing.category] ?? listing.category;

              return (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors cursor-pointer">
                    <div className="h-44 bg-gray-50 relative flex items-center justify-center">
                      {photo ? (
                        <img
                          src={photo}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-300 text-xs">Pas de photo</span>
                      )}
                      <span
                        className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}
                      >
                        {label}
                      </span>
                    </div>

                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 truncate mb-0.5">
                        {listing.title}
                      </p>
                      <p className="text-xs text-gray-400 mb-2">{listing.city}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-700">
                          {listing.price_per_day} €/jour
                        </span>
                        <span className="text-xs text-gray-300">
                          Caution {listing.deposit_amount} €
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
