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

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }

    fetchListing();
  }, [id]);

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

  const badgeClass = CATEGORY_COLORS[listing.category] ?? "bg-gray-100 text-gray-700";
  const label = CATEGORY_LABELS[listing.category] ?? listing.category;

  return (
    <div className="min-h-screen bg-white">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
          Retour aux annonces
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Photo principale */}
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

        {/* Miniatures */}
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

        {/* Infos principales */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass} mb-2 inline-block`}>
              {label}
            </span>
            <h1 className="text-2xl font-medium text-gray-900 mb-1">{listing.title}</h1>
            <p className="text-gray-400 text-sm">{listing.city}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium text-purple-700">{listing.price_per_day} €<span className="text-base font-normal text-gray-400">/jour</span></p>
            <p className="text-sm text-gray-400">Caution : {listing.deposit_amount} €</p>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="border-t border-gray-100 pt-6 mb-8">
            <h2 className="text-base font-medium text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Bouton contacter */}
        <div className="border-t border-gray-100 pt-6">
          <button
            onClick={() => router.push(`/messages?listing=${listing.id}&owner=${listing.owner_id}`)}
            className="w-full py-3 bg-purple-700 text-white font-medium rounded-xl hover:bg-purple-800 transition-colors"
          >
            Contacter le loueur
          </button>
        </div>

      </div>
    </div>
  );
}
