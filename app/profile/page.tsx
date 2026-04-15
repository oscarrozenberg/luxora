"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating: number;
  rating_count: number;
  email: string | null;
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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    bio: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);
      fetchProfile(data.user.id);
      fetchListings(data.user.id);
    });
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setForm({
        username: data.username ?? "",
        full_name: data.full_name ?? "",
        bio: data.bio ?? "",
      });
    }
    setLoading(false);
  }

  async function fetchListings(userId: string) {
    const { data } = await supabase
      .from("listings")
      .select("*, listing_photos(url, sort_order)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (data) setListings(data);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        username: form.username,
        full_name: form.full_name,
        bio: form.bio,
      });

    if (error) {
      setError("Erreur lors de la sauvegarde.");
    } else {
      setSuccess("Profil mis a jour !");
      setEditing(false);
      fetchProfile(user.id);
    }
    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").upsert({
        id: user.id,
        avatar_url: urlData.publicUrl,
      });
      fetchProfile(user.id);
    }
    setUploadingAvatar(false);
  }

  async function handleDeleteListing(id: string) {
    await supabase.from("listings").delete().eq("id", id);
    setListings(listings.filter((l) => l.id !== id));
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? "#7C3AED" : "#E5E7EB", fontSize: 18 }}>★</span>
    ));
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-900 text-gray-900 caret-gray-900";

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

  return (
    <div className="min-h-screen bg-white">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        <div className="flex items-center gap-6">
          <Link href="/messages" className="text-sm text-gray-500 hover:text-gray-900">Messages</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Se deconnecter
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Avatar et infos */}
        <div className="flex items-start gap-6 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden border border-gray-100">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-medium text-purple-700">
                  {profile?.username?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-6 h-6 bg-purple-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-800">
              <span className="text-white text-xs">+</span>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
            {uploadingAvatar && <p className="text-xs text-gray-400 mt-1">Upload...</p>}
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-medium text-gray-900">
              {profile?.full_name || profile?.username || user?.email}
            </h1>
            {profile?.username && (
              <p className="text-sm text-gray-400 mb-1">@{profile.username}</p>
            )}
            <div className="flex items-center gap-2">
              <div className="flex">{renderStars(profile?.rating ?? 0)}</div>
              <span className="text-sm text-gray-400">
                {profile?.rating_count ?? 0} avis
              </span>
            </div>
            {profile?.bio && (
              <p className="text-sm text-gray-600 mt-2">{profile.bio}</p>
            )}
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="text-sm font-medium bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
          >
            {editing ? "Annuler" : "Modifier"}
          </button>
        </div>

        {/* Formulaire modification */}
        {editing && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom d utilisateur</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Ex: oscar_r"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Ex: Oscar Rozenberg"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Parle un peu de toi..."
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        )}

        {/* Mes annonces */}
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-base font-medium text-gray-900 mb-4">Mes annonces</h2>

          {listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-4">Tu n as pas encore d annonce.</p>
              <Link
                href="/listings/new"
                className="text-sm font-medium bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
              >
                Publier une annonce
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {listings.map((listing) => {
                const photo = listing.listing_photos?.[0]?.url;
                return (
                  <div key={listing.id} className="flex items-center gap-4 border border-gray-100 rounded-xl p-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                      {photo ? (
                        <img src={photo} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-300 text-xs">—</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                      <p className="text-xs text-gray-400">{listing.city}</p>
                      <p className="text-xs text-purple-700 font-medium">{listing.price_per_day} euro/jour</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/listings/${listing.id}`}
                        className="text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg"
                      >
                        Voir
                      </Link>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-lg"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
