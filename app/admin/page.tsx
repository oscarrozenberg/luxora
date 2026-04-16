"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_ID = "3c24d9fb-a045-460b-80fa-e34a901e8830";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  reporter: { username: string | null; full_name: string | null; email: string | null };
  listing: { id: string; title: string; city: string; owner_id: string };
};

type Listing = {
  id: string;
  title: string;
  city: string;
  category: string;
  price_per_day: number;
  created_at: string;
  owner: { username: string | null; full_name: string | null; email: string | null };
};

type User = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  created_at: string;
  rating: number;
  rating_count: number;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reports" | "listings" | "users">("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.id !== ADMIN_ID) {
        router.push("/");
        return;
      }
      fetchAll();
    });
  }, []);

  async function fetchAll() {
    const { data: reportData } = await supabase
      .from("reports")
      .select("*, reporter:profiles!reports_reporter_id_fkey(username, full_name, email), listing:listings(id, title, city, owner_id)")
      .order("created_at", { ascending: false });

    if (reportData) setReports(reportData);

    const { data: listingData } = await supabase
      .from("listings")
      .select("*, owner:profiles!listings_owner_id_fkey(username, full_name, email)")
      .order("created_at", { ascending: false });

    if (listingData) setListings(listingData);

    const { data: userData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (userData) setUsers(userData);

    setLoading(false);
  }

  async function deleteListing(listingId: string) {
    await supabase.from("listing_photos").delete().eq("listing_id", listingId);
    await supabase.from("favorites").delete().eq("listing_id", listingId);
    await supabase.from("reports").delete().eq("listing_id", listingId);
    await supabase.from("conversations").delete().eq("listing_id", listingId);
    await supabase.from("listings").delete().eq("id", listingId);
    setListings(listings.filter((l) => l.id !== listingId));
    setReports(reports.filter((r) => r.listing?.id !== listingId));
    setConfirmAction(null);
  }

  async function deleteReport(reportId: string) {
    await supabase.from("reports").delete().eq("id", reportId);
    setReports(reports.filter((r) => r.id !== reportId));
    setConfirmAction(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-medium tracking-widest text-gray-900">Luxora</span>
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Retour au site</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        <h1 className="text-2xl font-medium text-gray-900 mb-6">Tableau de bord</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Signalements</p>
            <p className="text-2xl font-medium text-red-500">{reports.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Annonces</p>
            <p className="text-2xl font-medium text-purple-700">{listings.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Utilisateurs</p>
            <p className="text-2xl font-medium text-gray-900">{users.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "reports", label: `Signalements (${reports.length})` },
            { key: "listings", label: `Annonces (${listings.length})` },
            { key: "users", label: `Utilisateurs (${users.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-purple-700 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Signalements */}
        {activeTab === "reports" && (
          <div className="flex flex-col gap-3">
            {reports.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                <p className="text-gray-400 text-sm">Aucun signalement pour le moment.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{report.reason}</span>
                      <p className="text-sm font-medium text-gray-900 mt-2">{report.listing?.title ?? "Annonce supprimée"}</p>
                      <p className="text-xs text-gray-400">{report.listing?.city}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(report.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  {report.details && (
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">{report.details}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Signalé par : {report.reporter?.full_name ?? report.reporter?.username ?? report.reporter?.email ?? "Inconnu"}
                    </p>
                    <div className="flex gap-2">
                      {report.listing?.id && (
                        <Link
                          href={`/listings/${report.listing.id}`}
                          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                          Voir l'annonce
                        </Link>
                      )}
                      {report.listing?.id && (
                        <button
                          onClick={() => setConfirmAction({ type: "deleteListing", id: report.listing.id })}
                          className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Supprimer l'annonce
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmAction({ type: "deleteReport", id: report.id })}
                        className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                      >
                        Ignorer
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Annonces */}
        {activeTab === "listings" && (
          <div className="flex flex-col gap-3">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                  <p className="text-xs text-gray-400">{listing.city} — {listing.category}</p>
                  <p className="text-xs text-gray-400">
                    Par : {listing.owner?.full_name ?? listing.owner?.username ?? listing.owner?.email ?? "Inconnu"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-purple-700">{listing.price_per_day} €/jour</p>
                  <Link href={`/listings/${listing.id}`} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    Voir
                  </Link>
                  <button
                    onClick={() => setConfirmAction({ type: "deleteListing", id: listing.id })}
                    className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Utilisateurs */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-3">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-700">
                      {user.username?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.full_name ?? user.username ?? "Sans nom"}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{user.rating_count ?? 0} avis</p>
                    <p className="text-xs text-purple-700">{user.rating ?? 0} ★</p>
                  </div>
                  <Link href={`/user/${user.id}`} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    Voir profil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Popup confirmation */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-medium text-gray-900 mb-2">
              {confirmAction.type === "deleteListing" ? "Supprimer l'annonce" : "Ignorer le signalement"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {confirmAction.type === "deleteListing"
                ? "Cette annonce sera supprimée définitivement."
                : "Ce signalement sera archivé."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === "deleteListing") deleteListing(confirmAction.id);
                  else deleteReport(confirmAction.id);
                }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
