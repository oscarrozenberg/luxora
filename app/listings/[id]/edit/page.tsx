"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
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

export default function EditListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const [form, setForm] = useState({
    title: "",
    description: "",
    city: "",
    price_per_day: "",
    deposit_amount: "",
  });

  useEffect(() => {
    async function fetchListing() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) { router.push("/"); return; }
      if (data.owner_id !== user.id) { router.push("/"); return; }

      setForm({
        title: data.title,
        description: data.description ?? "",
        city: data.city,
        price_per_day: data.price_per_day.toString(),
        deposit_amount: data.deposit_amount.toString(),
      });
      setSelectedCategory(data.category ?? "");
      setSelectedSubCategory(data.subcategory ?? "");

      const { data: photoData } = await supabase
        .from("listing_photos")
        .select("*")
        .eq("listing_id", id)
        .order("sort_order", { ascending: true });

      if (photoData) setPhotos(photoData);

      const { data: blocked } = await supabase
        .from("blocked_dates")
        .select("date")
        .eq("listing_id", id);
      if (blocked) setBlockedDates(blocked.map((b: any) => b.date));

      setLoading(false);
    }

    fetchListing();
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setNewPhotos(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  async function handleDeletePhoto(photoId: string) {
    await supabase.from("listing_photos").delete().eq("id", photoId);
    setPhotos(photos.filter((p) => p.id !== photoId));
  }

  async function toggleBlockedDate(date: string) {
    if (blockedDates.includes(date)) {
      await supabase.from("blocked_dates").delete().eq("listing_id", id).eq("date", date);
      setBlockedDates(blockedDates.filter(d => d !== date));
    } else {
      await supabase.from("blocked_dates").insert({ listing_id: id, date });
      setBlockedDates([...blockedDates, date]);
    }
  }

  async function handleSave() {
    setError("");

    if (!form.title || !form.city || !form.price_per_day || !form.deposit_amount || !selectedCategory || !selectedSubCategory) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }

    setSaving(true);

    // Sauvegarde l'ancien prix dans l'historique si il a changé
    const { data: currentListing } = await supabase
      .from("listings")
      .select("price_per_day")
      .eq("id", id)
      .single();

    if (currentListing && parseFloat(form.price_per_day) !== currentListing.price_per_day) {
      await supabase.from("price_history").insert({
        listing_id: id,
        price: currentListing.price_per_day,
      });
    }

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        title: form.title,
        description: form.description,
        category: selectedCategory,
        subcategory: selectedSubCategory,
        city: form.city,
        price_per_day: parseFloat(form.price_per_day),
        deposit_amount: parseFloat(form.deposit_amount),
      })
      .eq("id", id);

    if (updateError) {
      setError("Erreur lors de la sauvegarde.");
      setSaving(false);
      return;
    }

    for (let i = 0; i < newPhotos.length; i++) {
      const file = newPhotos[i];
      const ext = file.name.split(".").pop();
      const path = `${id}/${Date.now()}_${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, file);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(path);

        await supabase.from("listing_photos").insert({
          listing_id: id,
          url: urlData.publicUrl,
          sort_order: photos.length + i,
        });
      }
    }

    setSaving(false);
    router.push(`/listings/${id}`);
  }

  async function handleDelete() {
    await supabase.from("listing_photos").delete().eq("listing_id", id);
    await supabase.from("favorites").delete().eq("listing_id", id);
    await supabase.from("conversations").delete().eq("listing_id", id);
    await supabase.from("listings").delete().eq("id", id);
    router.push("/profile");
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-900 text-gray-900 caret-gray-900";

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-12">
          <div className="bg-gray-100 rounded-2xl h-32 animate-pulse mb-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">

      <Navbar />

      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-medium text-gray-900 mb-8">Modifier l'annonce</h1>

        <div className="flex flex-col gap-5">

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Titre *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} className={inputClass} />
          </div>

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

          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Sous-categorie *</label>
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className={inputClass + " text-gray-900"}
              >
                <option value="">Choisir une sous-categorie</option>
                {(CATEGORIES[selectedCategory] ?? []).map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

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

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-1">Prix par jour (€) *</label>
              <input type="number" name="price_per_day" value={form.price_per_day} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-1">Caution (€) *</label>
              <input type="number" name="deposit_amount" value={form.deposit_amount} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={inputClass + " resize-none"} />
          </div>

          {photos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Photos actuelles</label>
              <div className="flex gap-2 flex-wrap">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img src={photo.url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-100" />
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Ajouter des photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleNewPhotos}
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

          {/* Calendrier disponibilités */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Dates indisponibles</label>
            <p className="text-xs text-gray-400 mb-3">Clique sur une date pour la bloquer ou débloquer.</p>
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))} className="text-gray-400 hover:text-gray-900 px-2">←</button>
                <span className="text-sm font-medium text-gray-900">
                  {selectedMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))} className="text-gray-400 hover:text-gray-900 px-2">→</button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                  <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const year = selectedMonth.getFullYear();
                  const month = selectedMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const offset = firstDay === 0 ? 6 : firstDay - 1;
                  const cells = [];
                  for (let i = 0; i < offset; i++) cells.push(<div key={`e-${i}`} />);
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const isBlocked = blockedDates.includes(dateStr);
                    const isPast = new Date(dateStr) < new Date();
                    cells.push(
                      <button
                        key={dateStr}
                        onClick={() => !isPast && toggleBlockedDate(dateStr)}
                        disabled={isPast}
                        className={`text-xs py-1.5 rounded-lg text-center transition-colors ${
                          isPast ? "text-gray-200 cursor-default" :
                          isBlocked ? "bg-red-500 text-white" :
                          "hover:bg-purple-50 text-gray-700"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  }
                  return cells;
                })()}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500"/><span className="text-xs text-gray-500">Bloqué</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-purple-100"/><span className="text-xs text-gray-500">Disponible</span></div>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
          </button>

          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-3 bg-white text-red-500 font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
          >
            Supprimer l'annonce
          </button>

        </div>
      </div>

      {/* Popup confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-medium text-gray-900 mb-2">Supprimer l'annonce</h3>
            <p className="text-sm text-gray-500 mb-6">Cette action est irréversible. Tu veux vraiment supprimer cette annonce ?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Supprimer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
