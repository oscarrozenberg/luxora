"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Navbar from "@/components/Navbar";

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState("recent");

  async function fetchUnreadCount(userId: string) {
    const { data: convData } = await supabase
      .from("conversations")
      .select("id")
      .or(`owner_id.eq.${userId},renter_id.eq.${userId}`);

    if (!convData || convData.length === 0) {
      setUnreadCount(0);
      return;
    }

    const convIds = convData.map((c: any) => c.id);

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .eq("is_read", false)
      .neq("sender_id", userId);

    setUnreadCount(count ?? 0);
  }

  // Recupere l'utilisateur
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // Compte les messages non lus quand l'utilisateur est connu
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount(user.id);

    // Demande permission notifications navigateur
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Ecoute les nouveaux messages en temps reel
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, async (payload: any) => {
        const msg = payload.new;
        if (msg.sender_id === user.id) return;

        const { data: conv } = await supabase
          .from("conversations")
          .select("id")
          .eq("id", msg.conversation_id)
          .or(`owner_id.eq.${user.id},renter_id.eq.${user.id}`)
          .maybeSingle();

        if (conv) {
          setUnreadCount((prev) => prev + 1);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Nouveau message sur Luxor-A", {
              body: msg.content,
              icon: "/favicon.ico",
            });
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Recalcule le badge quand on revient sur la page
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && user) {
        fetchUnreadCount(user.id);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user]);

  // Charge les annonces
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

  // Applique les filtres
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
      result = result.filter((l) =>
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q)
      );
    }
    if (minPrice) {
      result = result.filter((l) => l.price_per_day >= parseFloat(minPrice));
    }
    if (maxPrice) {
      result = result.filter((l) => l.price_per_day <= parseFloat(maxPrice));
    }
    if (filterCity.trim()) {
      result = result.filter((l) =>
        l.city.toLowerCase().includes(filterCity.toLowerCase())
      );
    }
    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => a.price_per_day - b.price_per_day);
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => b.price_per_day - a.price_per_day);
    }

    setFiltered(result);
  }, [activeCategory, activeSubCategory, search, listings, minPrice, maxPrice, filterCity, sortBy]);

  function resetFilters() {
    setMinPrice("");
    setMaxPrice("");
    setFilterCity("");
    setSortBy("recent");
    setShowFilters(false);
  }

  const activeFiltersCount = [minPrice, maxPrice, filterCity, sortBy !== "recent"].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">

      <Navbar />

      {/* Header mobile */}
      <div className="md:hidden px-4 pt-6 pb-2">
        <span className="text-2xl font-medium tracking-widest text-gray-900">Luxor-A</span>
      </div>

      <section className="text-center px-4 py-6 md:py-12">
        <h1 className="text-2xl md:text-4xl font-medium text-gray-900 mb-2 leading-tight">
          Louez tout, entre particuliers
        </h1>
        <p className="text-gray-500 text-sm md:text-base mb-6">
          Immobilier, véhicules, mode et bien plus.
        </p>
        <div className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Rechercher une annonce..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-900 text-gray-900 caret-gray-900"
          />
          <button
            onClick={() => setShowFilters(true)}
            className={`px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors relative ${
              activeFiltersCount > 0
                ? "bg-purple-700 text-white border-purple-700"
                : "bg-white text-gray-900 border-gray-200 hover:border-gray-300"
            }`}
          >
            Filtres
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Filtres categories */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{scrollbarWidth:'none'}}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setActiveSubCategory(""); }}
            className={`px-4 py-1.5 text-sm rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${
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
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto" style={{scrollbarWidth:'none'}}>
          <button
            onClick={() => setActiveSubCategory("")}
            className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${
              activeSubCategory === "" ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-900"
            }`}
          >
            Tout
          </button>
          {SUBCATEGORIES[activeCategory].map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubCategory(sub)}
              className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${
                activeSubCategory === sub ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-900"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      <section className="px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-gray-900">
            {filtered.length} annonce{filtered.length > 1 ? "s" : ""}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-56 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center">Aucune annonce trouvee.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((listing) => {
              const photo = listing.listing_photos?.[0]?.url;
              return (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors cursor-pointer">
                    <div className="h-36 md:h-44 bg-gray-50 relative flex items-center justify-center">
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
              );
            })}
          </div>
        )}
      </section>

      {/* Panneau filtres avancés */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-end md:items-center justify-center px-0 md:px-4">
          <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-5 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-medium text-gray-900">Filtres avancés</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Prix par jour</label>
                <div className="flex gap-2 items-center w-full">
                  <input
                    type="number"
                    placeholder="Min €"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    style={{minWidth:0}}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-900 placeholder:text-gray-900"
                  />
                  <span className="text-gray-400 text-sm flex-shrink-0">—</span>
                  <input
                    type="number"
                    placeholder="Max €"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    style={{minWidth:0}}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-900 placeholder:text-gray-900"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-900 mb-2">Ville</label>
                <input
                  type="text"
                  placeholder="Ex: Paris, Lyon..."
                  value={filterCity}
                  onChange={async (e) => {
                    setFilterCity(e.target.value);
                    const q = e.target.value;
                    if (q.length < 2) { setCitySuggestions([]); return; }
                    const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${q}&fields=nom,codesPostaux&limit=5`);
                    const data = await res.json();
                    setCitySuggestions(data);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-900 placeholder:text-gray-900"
                  autoComplete="off"
                />
                {citySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 overflow-hidden">
                    {citySuggestions.map((c: any) => (
                      <button
                        key={c.nom}
                        onClick={() => { setFilterCity(c.nom); setCitySuggestions([]); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-purple-50 border-b border-gray-50 last:border-0"
                      >
                        {c.nom} — {c.codesPostaux[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Trier par</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "recent", label: "Plus récent" },
                    { value: "price_asc", label: "Prix croissant" },
                    { value: "price_desc", label: "Prix décroissant" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        sortBy === option.value
                          ? "bg-purple-700 text-white border-purple-700"
                          : "border-gray-200 text-gray-900 hover:border-gray-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-sm font-medium hover:bg-purple-800"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
{/* Footer desktop */}
<div className="hidden md:flex justify-center py-6 border-t border-gray-100">
  <Link href="/legal" className="text-xs text-gray-400 hover:text-gray-600">
    Conditions générales d'utilisation
  </Link>
</div>
      {/* Barre navigation mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 z-40">
        <Link href="/" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-purple-700">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="text-xs text-purple-700 font-medium">Accueil</span>
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
        <Link href="/messages" className="relative flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="text-xs text-gray-400">Messages</span>
        </Link>
        <Link href={user ? "/profile" : "/auth"} className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-xs text-gray-400">{user ? "Profil" : "Connexion"}</span>
        </Link>
      </div>
    </div>
  );
}
