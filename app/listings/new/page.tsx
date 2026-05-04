"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const CATEGORIES: Record<string, string[]> = {
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

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [requiresVerification, setRequiresVerification] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    city: "",
    price_per_day: "",
    deposit_amount: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/auth");
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPhotos(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit() {
    setError("");

    if (!form.title || !form.city || !form.price_per_day || !form.deposit_amount || !selectedCategory || !selectedSubCategory) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu dois etre connecte pour publier une annonce.");
      setLoading(false);
      return;
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        title: form.title,
        description: form.description,
        category: selectedCategory,
        subcategory: selectedSubCategory,
        city: form.city,
        price_per_day: parseFloat(form.price_per_day),
        deposit_amount: parseFloat(form.deposit_amount),
owner_id: user.id,
requires_verification: requiresVerification,
      })
      .select()
      .single();

    if (listingError || !listing) {
      setError("Erreur lors de la publication. Reessaie.");
      setLoading(false);
      return;
    }

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const ext = file.name.split(".").pop();
      const path = `${listing.id}/${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, file);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(path);

        await supabase.from("listing_photos").insert({
          listing_id: listing.id,
          url: urlData.publicUrl,
          sort_order: i,
        });
      }
    }

    router.push(`/listings/${listing.id}?newlisting=true`);
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-900 text-gray-900 caret-gray-900";

  return (
    <div className="min-h-screen bg-white">

      <Navbar />

      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-medium text-gray-900 mb-8">Publier une annonce</h1>

        <div className="flex flex-col gap-5">

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Titre *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ex: Appartement lumineux centre-ville"
              className={inputClass}
            />
          </div>

          {/* Categorie */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Categorie *</label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubCategory(""); }}
              className={inputClass + " text-gray-900"}
            >
              <option value="">Choisir une categorie</option>
              {Object.keys(CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sous-categorie */}
          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Sous-categorie *</label>
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className={inputClass + " text-gray-900"}
              >
                <option value="">Choisir une sous-categorie</option>
                {CATEGORIES[selectedCategory].map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Ville */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-900 mb-1">Ville *</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={async (e) => {
                handleChange(e);
                const q = e.target.value;
                if (q.length < 2) { setCitySuggestions([]); return; }
                const isPostalCode = /^\d+$/.test(q);
                const url = isPostalCode
                  ? `https://geo.api.gouv.fr/communes?codePostal=${q}&fields=nom,codesPostaux&limit=10&type=commune-actuelle,arrondissement-municipal`
                  : `https://geo.api.gouv.fr/communes?nom=${q}&fields=nom,codesPostaux&limit=10&type=commune-actuelle,arrondissement-municipal`;
                const res = await fetch(url);
                const data = await res.json();
                setCitySuggestions(data);
              }}
              placeholder="Ex: Paris, Lyon, 75015..."
              className={inputClass}
              autoComplete="off"
            />
            {citySuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 overflow-hidden">
                {citySuggestions.map((c: any) => (
                  <button
                    key={c.nom + c.codesPostaux[0]}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, city: `${c.nom} (${c.codesPostaux[0]})` });
                      setCitySuggestions([]);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-purple-50 hover:text-purple-800 border-b border-gray-50 last:border-0"
                  >
                    {c.nom} — {c.codesPostaux[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prix et caution */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-1">Prix par jour (€) *</label>
              <input
                type="number"
                name="price_per_day"
                value={form.price_per_day}
                onChange={handleChange}
                placeholder="Ex: 45"
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-1">Caution (€) *</label>
              <input
                type="number"
                name="deposit_amount"
                value={form.deposit_amount}
                onChange={handleChange}
                placeholder="Ex: 800"
                className={inputClass}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Decris ton article, son etat, les conditions de location..."
              rows={4}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotos}
              className="w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200"
            />
            {previews.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {previews.map((src, i) => (
                  <img key={i} src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-100" />
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
<div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
  <input
    type="checkbox"
    id="requires_verification"
    checked={requiresVerification}
    onChange={(e) => setRequiresVerification(e.target.checked)}
    className="accent-purple-700 w-4 h-4"
  />
  <label htmlFor="requires_verification" className="text-sm text-gray-900 cursor-pointer">
    Exiger la vérification d'identité pour réserver
  </label>
</div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Publication en cours..." : "Publier l'annonce"}
          </button>

        </div>
      </div>
    </div>
  );
}
