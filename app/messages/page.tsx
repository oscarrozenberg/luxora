"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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
};

export default function MessagesPage() {
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
      };
    });

    setConversations(formatted);
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
      setNewMessage("");
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
    <div className="min-h-screen bg-white">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Retour</Link>
      </nav>

      <div className="flex h-[calc(100vh-65px)]">

        <div className="w-80 border-r border-gray-100 flex flex-col">
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
                  onClick={() => { setActiveConversation(conv.id); setNewMessage(""); }}
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
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.other_username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{conv.listing_title}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!activeConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Selectionne une conversation</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-gray-400 mt-8">Commence la conversation !</p>
                )}
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
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

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
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
                  className="px-5 py-2.5 bg-purple-700 text-white text-sm font-medium rounded-lg hover:bg-purple-800 transition-colors disabled:opacity-50"
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
