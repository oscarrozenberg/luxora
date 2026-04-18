"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
};

type Conversation = {
  id: string;
  listing_id: string;
  owner_id: string;
  renter_id: string;
  other_username: string;
  listing_title: string;
  listing_photo: string | null;
  unread_count: number;
};

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listing");
  const ownerId = searchParams.get("owner");

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!user || !ownerId) return;
    startOrJoinConversation();
  }, [user, ownerId]);

  useEffect(() => {
    if (!activeConversation) return;
    fetchMessages(activeConversation);

    const channel = supabase
      .channel("messages:" + activeConversation)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeConversation}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        // Marque comme lu immediatement si la conversation est ouverte
        if (user) {
          supabase
            .from("messages")
            .update({ is_read: true })
            .eq("id", (payload.new as any).id)
            .neq("sender_id", user.id)
            .then(() => {
              fetchConversations();
            });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    const { data } = await supabase
      .from("conversations")
      .select("*, owner:profiles!conversations_owner_id_fkey(username, full_name), renter:profiles!conversations_renter_id_fkey(username, full_name), listing:listings(title, listing_photos(url, sort_order))")
      .or(`owner_id.eq.${user.id},renter_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const formatted = (data ?? []).map((conv: any) => {
      const isOwner = conv.owner_id === user.id;
      const other = isOwner ? conv.renter : conv.owner;
      const photo = conv.listing?.listing_photos?.[0]?.url ?? null;
      return {
        ...conv,
        other_username: other?.full_name ?? other?.username ?? "Utilisateur",
        listing_title: conv.listing?.title ?? "Annonce supprimee",
        listing_photo: photo,
        unread_count: 0,
      };
    });

    const withUnread = await Promise.all(
      formatted.map(async (conv: any) => {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", user.id);
        return { ...conv, unread_count: count ?? 0 };
      })
    );

    setConversations(withUnread);
    setLoading(false);
  }

  async function startOrJoinConversation() {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("renter_id", user.id)
      .maybeSingle();

    if (existing) {
      setActiveConversation(existing.id);
      setShowList(false);
      return;
    }

    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        listing_id: listingId ?? null,
        owner_id: ownerId,
        renter_id: user.id,
      })
      .select()
      .single();

    if (newConv) {
      setActiveConversation(newConv.id);
      setNewMessage("Bonjour, je suis interesse(e) par votre annonce. Est-elle disponible ?");
      setShowList(false);
      fetchConversations();
    }
  }

  async function fetchMessages(convId: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);

    if (user) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", convId)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      fetchConversations();
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeConversation || !user) return;
    setSending(true);

    await supabase.from("messages").insert({
      conversation_id: activeConversation,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    setNewMessage("");
    setSending(false);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      <nav className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        {activeConversation && !showList ? (
          <button onClick={() => { setShowList(true); setActiveConversation(null); }} className="text-sm text-gray-500 hover:text-gray-900 md:hidden">
            Retour
          </button>
        ) : (
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Retour</Link>
        )}
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Liste conversations */}
        <div className={`${showList ? "flex" : "hidden"} md:flex w-full md:w-80 border-r border-gray-100 flex-col`}>
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">Mes conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-gray-400 text-center mt-8 px-4">Aucune conversation pour l instant.</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setActiveConversation(conv.id); setNewMessage(""); setShowList(false); }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                    activeConversation === conv.id ? "bg-purple-50 border-l-2 border-l-purple-500" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {conv.listing_photo ? (
                      <img src={conv.listing_photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-300 text-xs">—</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${conv.unread_count > 0 ? "font-medium text-gray-900" : "font-normal text-gray-700"}`}>
                        {conv.other_username}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 bg-purple-700 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{conv.listing_title}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Zone messages */}
        <div className={`${!showList ? "flex" : "hidden"} md:flex flex-1 flex-col`}>
          {!activeConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Selectionne une conversation</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-gray-400 mt-8">Commence la conversation !</p>
                )}
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  const isBooking = msg.content.startsWith('"') && msg.content.includes("est louée du");

                  if (isBooking) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="bg-white border border-purple-200 rounded-2xl p-4 max-w-sm w-full shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-purple-700">Confirmation de réservation</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{msg.content}</p>
                          <div className="mt-3 pt-3 border-t border-purple-100">
                            <span className="text-xs text-purple-500 font-medium">Luxora</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm break-words ${
                        isMe
                          ? "bg-purple-700 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-900 rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="px-4 py-4 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ecris un message..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-900 text-gray-900 caret-gray-900"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2.5 bg-purple-700 text-white text-sm font-medium rounded-lg hover:bg-purple-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Envoyer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-400 text-sm">Chargement...</p></div>}>
      <MessagesContent />
    </Suspense>
  );
}
