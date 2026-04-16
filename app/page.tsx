"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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
  listing_photos?: { url: string }[];
};

const CATEGORIES = [
  "Tout",
  "Immobilier",
  "Véhicules",
  "Vacances",
  "Mode",
  "Maison & Jardin",
  "Famille",
  "Électronique",
  "Loisirs",
  "Autres",
];

const SUBCATEGORIES: Record<string, string[]> = {
  "Immobilier": ["Appartement", "Maison", "Chambre", "Bureau / Local commercial", "Parking / Garage"],
  "Véhicules": ["Voiture", "Moto", "Utilitaire", "Vélo", "Trottinette", "Bateau", "Camping-car"],
  "Vacances": ["Villa", "Appartement de vacances", "Chalet", "Cabane", "Tente / Glamping"],
  "Mode": ["Vêtements femme", "Vêtements homme", "Chaussures", "Accessoires", "Montres", "Sacs", "Bijoux"],
  "Maison & Jardin": ["Meubles", "Électroménager", "Outils / Bricolage", "Matériel jardinage", "Déco événementielle"],
  "Famille": ["Puériculture", "Jouets", "Matériel bébé", "Vêtements enfants"],
  "Électronique": ["Téléphones", "Ordinateurs", "TV / Audio", "Consoles", "Appareil photo / Vidéo"],
  "Loisirs": ["Équipement sportif", "Instruments de musique", "Matériel photo / vidéo", "Jeux de société", "Déguisements"],
  "Autres": ["Divers"],
};

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [activeSubCategory, setActiveSubCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

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

    if (activeCategory !== "Tout") {
      result = result.filter((l) => l.category === activeCategory);
    }

    if (activeSubCategory) {
      result = result.filter((l) => l.subcategory === activeSubCategory);
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
  }, [activeCategory, activeSubCategory, search, listings]);

  return (
    <div className="min-h-screen bg-white">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="text-xl font-medium tracking-widest text-gray-900">Luxora</span>
        <div className="flex items-center gap-6">
          <Link href="/messages" className="text-sm text-gray-900 hover:text-gray-600">Messages</Link>
          <Link href="/listings/new" className="text-sm font-medium bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors">
            Publier une annonce
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-sm text-gray-900 hover:text-gray-600">Mon profil</Link>
              <button
                onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
                className="text-sm text-gray-900 hover:text-gray-600"
              >
                Se deconnecter
              </button>
            </div>
          ) : (
            <Link href="/auth" className="text-sm text-gray-900 hover:text-gray-600">Se connecter</Link>
          )}
        </div>
      </nav>

      <section className="text-center px-6 py-16">
        <h1 className="text-4xl font-medium text-gray-900 mb-3 leading-tight">
          Votre rêve devenu une réalité
        </h1>
        <p className="text-gray-500 text-base mb-8">
          Immobilier, véhicules, mode et bien plus — trouvez ce dont vous avez besoin.
        </p>
        <div className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Rechercher une annonce..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-900 text-gray-900 caret-gray-900"
          />
          <button className="px-5 py-2.5 bg-purple-700 text-white text-sm font-medium rounded-lg hover:bg-purple-800 transition-colors">
            Rechercher
          </button>
        </div>
      </section>

      {/* Filtres categories */}
      <div className="flex gap-2 px-6 pb-3 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setActiveSubCategory(""); }}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
              activeCategory === cat
                ? "bg-purple-100 text-purple-800 border-purple-300"
                : "border-gray-200 text-gray-900 hover:border-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filtres sous-categories */}
      {activeCategory !== "Tout" && SUBCATEGORIES[activeCategory] && (
        <div className="flex gap-2 px-6 pb-6 flex-wrap">
          <button
            onClick={() => setActiveSubCategory("")}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              activeSubCategory === ""
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-200 text-gray-900 hover:border-gray-300"
            }`}
          >
            Tout
          </button>
          {SUBCATEGORIES[activeCategory].map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubCategory(sub)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                activeSubCategory === sub
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-900 hover:border-gray-300"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

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

              return (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors cursor-pointer">
                    <div className="h-44 bg-gray-50 relative flex items-center justify-center">
                      {photo ? (
                        <img src={photo} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-300 text-xs">Pas de photo</span>
                      )}
                      <span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-900 text-white">
                        {listing.subcategory ?? listing.category}
                      </span>
                    </div>

                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 truncate mb-0.5">{listing.title}</p>
                      <p className="text-xs text-gray-400 mb-2">{listing.city}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-700">{listing.price_per_day} €/jour</span>
                        <span className="text-xs text-gray-300">Caution {listing.deposit_amount} €</span>
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
