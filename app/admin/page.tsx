"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

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
  is_sponsored: boolean;
  sponsored_until: string | null;
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

type Dispute = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: { username: string | null; full_name: string | null } | null;
  booking: { listing_id: string | null } | null;
  conversation_id: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reports" | "listings" | "users" | "disputes" | "verifications">("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string } | null>(null);
  const [verifications, setVerifications] = useState<any[]>([]);

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

    const { data: disputeData } = await supabase
  .from("disputes")
  .select("*, reporter:profiles!disputes_reporter_id_fkey(username, full_name), booking:bookings(listing_id), conversation_id")
  .order("created_at", { ascending: false });
    if (disputeData) setDisputes(disputeData);

    const { data: verifData } = await supabase
  .from("identity_verifications")
  .select("*, user:profiles(username, full_name, email)")
  .order("created_at", { ascending: false });
if (verifData) setVerifications(verifData);
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

  async function updateDisputeStatus(disputeId: string, status: string) {
    await supabase.from("disputes").update({ status }).eq("id", disputeId);
    setDisputes(disputes.map(d => d.id === disputeId ? { ...d, status } : d));
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

      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">

        <h1 className="text-2xl font-medium text-gray-900 mb-6">Tableau de bord</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
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
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Litiges</p>
            <p className="text-2xl font-medium text-amber-500">{disputes.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "reports", label: `Signalements (${reports.length})` },
            { key: "listings", label: `Annonces (${listings.length})` },
            { key: "users", label: `Utilisateurs (${users.length})` },
            { key: "disputes", label: `Litiges (${disputes.length})` },
            { key: "verifications", label: `Vérifications (${verifications.length})` },
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
                        <Link href={`/listings/${report.listing.id}`} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                          Voir l'annonce
                        </Link>
                      )}
                      {report.listing?.id && (
                        <button onClick={() => setConfirmAction({ type: "deleteListing", id: report.listing.id })} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">
                          Supprimer l'annonce
                        </button>
                      )}
                      <button onClick={() => setConfirmAction({ type: "deleteReport", id: report.id })} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
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
                  <p className="text-xs text-gray-400">Par : {listing.owner?.full_name ?? listing.owner?.username ?? listing.owner?.email ?? "Inconnu"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-purple-700">{listing.price_per_day} €/jour</p>
                  {listing.is_sponsored && (
  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">⭐ Sponsorisé</span>
)}
<button
  onClick={async () => {
    const until = new Date();
    until.setDate(until.getDate() + 7);
    await supabase.from("listings").update({
      is_sponsored: !listing.is_sponsored,
      sponsored_until: listing.is_sponsored ? null : until.toISOString(),
    }).eq("id", listing.id);
    setListings(listings.map(l => l.id === listing.id ? { ...l, is_sponsored: !l.is_sponsored } : l));
  }}
  className={`text-xs px-3 py-1.5 rounded-lg ${listing.is_sponsored ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-amber-500 text-white hover:bg-amber-600"}`}
>
  {listing.is_sponsored ? "Retirer sponsoring" : "Sponsoriser 7j"}
</button>
<Link href={`/listings/${listing.id}`} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Voir</Link>
<button onClick={() => setConfirmAction({ type: "deleteListing", id: listing.id })} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">Supprimer</button>
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
                    <span className="text-sm font-medium text-purple-700">{user.username?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"}</span>
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
                  <Link href={`/user/${user.id}`} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Voir profil</Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Litiges */}
        {activeTab === "disputes" && (
          <div className="flex flex-col gap-3">
            {disputes.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                <p className="text-gray-400 text-sm">Aucun litige pour le moment.</p>
              </div>
            ) : (
              disputes.map((dispute) => (
                <div key={dispute.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{dispute.reason}</span>
                      <p className="text-xs text-gray-400 mt-1">
                        Signalé par : {dispute.reporter?.full_name ?? dispute.reporter?.username ?? "Inconnu"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        dispute.status === "open" ? "bg-red-100 text-red-700" :
                        dispute.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {dispute.status === "open" ? "Ouvert" : dispute.status === "in_progress" ? "En cours" : "Résolu"}
                      </span>
                      <p className="text-xs text-gray-400">{new Date(dispute.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  {dispute.details && (
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">{dispute.details}</p>
                  )}
                  <div className="flex justify-end gap-2">
  {dispute.booking?.listing_id && (
    <Link href={`/listings/${dispute.booking.listing_id}`} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
      Voir l'annonce
    </Link>
  )}
  {dispute.conversation_id && (
  <Link href={`/messages?conv=${dispute.conversation_id}`} className="text-xs px-3 py-1.5 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50">
    Voir la conversation
  </Link>
)}
  {dispute.status === "open" && (
                      <button
                        onClick={() => updateDisputeStatus(dispute.id, "in_progress")}
                        className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                      >
                        Prendre en charge
                      </button>
                    )}
                    {dispute.status === "in_progress" && (
                      <button
                        onClick={() => updateDisputeStatus(dispute.id, "resolved")}
                        className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        Marquer résolu
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

{activeTab === "verifications" && (
  <div className="flex flex-col gap-3">
    {verifications.length === 0 ? (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
        <p className="text-gray-400 text-sm">Aucune vérification en attente.</p>
      </div>
    ) : (
      verifications.map((verif) => (
        <div key={verif.id} className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{verif.user?.full_name ?? verif.user?.username ?? "Inconnu"}</p>
              <p className="text-xs text-gray-400">{verif.user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">Document : {verif.document_type}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              verif.status === "pending" ? "bg-amber-100 text-amber-700" :
              verif.status === "verified" ? "bg-green-100 text-green-700" :
              "bg-red-100 text-red-700"
            }`}>
              {verif.status === "pending" ? "En attente" : verif.status === "verified" ? "Vérifié" : "Rejeté"}
            </span>
          </div>
          <div className="flex gap-2">
            <a href={verif.document_url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
  Recto
</a>
{verif.document_url && (
  <a href={verif.document_url.replace('recto', 'verso')} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
    Verso
  </a>
)}
{verif.document_url && (
  <a href={verif.document_url.replace('recto', 'selfie')} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
    Selfie
  </a>
)}
            {verif.status === "pending" && (
              <>
                <button
                  onClick={async () => {
                    await supabase.from("identity_verifications").update({ status: "verified" }).eq("id", verif.id);
                    setVerifications(verifications.map(v => v.id === verif.id ? { ...v, status: "verified" } : v));
                  }}
                  className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Valider
                </button>
                <button
                  onClick={async () => {
                    await supabase.from("identity_verifications").update({ status: "rejected" }).eq("id", verif.id);
                    setVerifications(verifications.map(v => v.id === verif.id ? { ...v, status: "rejected" } : v));
                  }}
                  className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Rejeter
                </button>
              </>
            )}
          </div>
        </div>
      ))
    )}
  </div>
)}

      {/* Popup confirmation */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-medium text-gray-900 mb-2">
              {confirmAction.type === "deleteListing" ? "Supprimer l'annonce" : "Ignorer le signalement"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {confirmAction.type === "deleteListing" ? "Cette annonce sera supprimée définitivement." : "Ce signalement sera archivé."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
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
