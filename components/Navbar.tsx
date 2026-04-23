"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) fetchUnreadCount(data.user.id);
    });
  }, []);

  async function fetchUnreadCount(userId: string) {
    const { data: convData } = await supabase
      .from("conversations")
      .select("id")
      .or(`owner_id.eq.${userId},renter_id.eq.${userId}`);

    if (!convData || convData.length === 0) return;
    const convIds = convData.map((c: any) => c.id);

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .eq("is_read", false)
      .neq("sender_id", userId);

    setUnreadCount(count ?? 0);
  }

  function navLink(href: string, label: string, exact = false) {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
          isActive
            ? "bg-purple-100 text-purple-800"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <nav className="hidden md:flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white sticky top-0 z-40">
      <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxor-A</Link>
      <div className="flex items-center gap-1">
        {navLink("/", "Accueil", true)}
        {navLink("/favorites", "Favoris")}
        <Link
          href="/messages"
          className={`relative text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
            pathname.startsWith("/messages")
              ? "bg-purple-100 text-purple-800"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          Messages
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        {navLink("/listings/new", "Publier une annonce")}
        {user ? (
          <>
            {navLink("/profile", "Mon profil")}
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              className="text-sm font-medium px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Se déconnecter
            </button>
          </>
        ) : (
          navLink("/auth", "Se connecter")
        )}
      </div>
    </nav>
  );
}
