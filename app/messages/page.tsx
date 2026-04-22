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
  other_avatar: string | null;
  listing_title: string;
  listing_photo: string | null;
  unread_count: number;
  last_message?: string;
};

type BookingPhoto = {
  id: string;
  type: string;
  url: string;
  user_id: string;
  created_at: string;
};

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listing");
  const ownerId = searchParams.get("owner");

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [bookingPhotos, setBookingPhotos] = useState<BookingPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoType, setPhotoType] = useState<"pickup" | "return">("pickup");
  const [showPhotos, setShowPhotos] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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
    const conv = conversations.find(c => c.id === activeConversation);
    if (conv) {
      setActiveConv(conv);
      fetchBooking(conv);
    }

    const channel = supabase
      .channel("messages:" + activeConversation)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeConversation}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        if (user) {
          supabase.from("messages").update({ is_read: true })
            .eq("id", (payload.new as any).id)
            .neq("sender_id", user.id)
            .then(() => { fetchConversations(); });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchBooking(conv: Conversation) {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("listing_id", conv.listing_id)
      .or(`owner_id.eq.${conv.owner_id},renter_id.eq.${conv.renter_id}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setBooking(data);
      fetchBookingPhotos(data.id);
    }
  }

  async function fetchBookingPhotos(bookingId: string) {
    const { data } = await supabase
      .from("booking_photos")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });
    if (data) setBookingPhotos(data);
  }

  async function fetchConversations() {
    const { data } = await supabase
      .from("conversations")
      .select("*, owner:profiles!conversations_owner_id_fkey(username, full_name, avatar_url), renter:profiles!conversations_renter_id_fkey(username, full_name, avatar_url), listing:listings(title, listing_photos(url, sort_order))")
      .or(`owner_id.eq.${user.id},renter_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const formatted = (data ?? []).map((conv: any) => {
      const isOwner = conv.owner_id === user.id;
      const other = isOwner ? conv.renter : conv.owner;
      const photo = conv.listing?.listing_photos?.[0]?.url ?? null;
      return {
        ...conv,
        other_username: other?.full_name ?? other?.username ?? "Utilisateur",
        other_avatar: other?.avatar_url ?? null,
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

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return { ...conv, unread_count: count ?? 0, last_message: lastMsg?.content ?? null };
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
      .insert({ listing_id: listingId ?? null, owner_id: ownerId, renter_id: user.id })
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
      await supabase.from("messages").update({ is_read: true })
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

    if (activeConv) {
      const otherUserId = activeConv.owner_id === user.id ? activeConv.renter_id : activeConv.owner_id;
      const { data: otherUser } = await supabase.from("profiles").select("email").eq("id", otherUserId).single();
      const { data: senderProfile } = await supabase.from("profiles").select("username, full_name").eq("id", user.id).single();

      if (otherUser?.email) {
        await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "new_message",
            to: otherUser.email,
            data: {
              sender_name: senderProfile?.full_name ?? senderProfile?.username ?? "Un utilisateur",
              message_preview: newMessage.trim().slice(0, 100),
            },
          }),
        });
      }
    }

    setNewMessage("");
    setSending(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !booking || !user) return;
    setUploadingPhoto(true);

    const ext = file.name.split(".").pop();
    const path = `${booking.id}/${photoType}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("booking-photos")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("booking-photos").getPublicUrl(path);

      await supabase.from("booking_photos").insert({
        booking_id: booking.id,
        user_id: user.id,
        type: photoType,
        url: urlData.publicUrl,
      });

      const label = photoType === "pickup" ? "réception" : "restitution";
      await supabase.from("messages").insert({
        conversation_id: activeConversation,
        sender_id: user.id,
        content: `📸 Photo de ${label} ajoutée : ${urlData.publicUrl}`,
      });

      fetchBookingPhotos(booking.id);
    }

    setUploadingPhoto(false);
    setShowPhotoModal(false);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return date.toLocaleDateString("fr-FR", { weekday: "short" });
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  }

  const currentConv = conversations.find(c => c.id === activeConversation);
  const pickupPhotos = bookingPhotos.filter(p => p.type === "pickup");
  const returnPhotos = bookingPhotos.filter(p => p.type === "return");

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#f8f8f8" }}>

      {/* Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #ebebeb", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zIndex: 10 }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 500, color: "#1a1a1a", textDecoration: "none", letterSpacing: "0.08em" }}>Luxora</Link>
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 28 }}>
          <Link href="/favorites" style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>Favoris</Link>
          <Link href="/messages" style={{ fontSize: 14, color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>Messages</Link>
          <Link href="/listings/new" style={{ fontSize: 13, fontWeight: 600, background: "#f5f0ff", color: "#7C3AED", padding: "7px 14px", borderRadius: 8, textDecoration: "none" }}>
            Publier une annonce
          </Link>
          <Link href="/profile" style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>Mon profil</Link>
        </div>
        {activeConversation && !showList ? (
          <button onClick={() => { setShowList(true); setActiveConversation(null); }} style={{ background: "none", border: "none", fontSize: 14, color: "#7C3AED", cursor: "pointer", fontWeight: 500 }} className="md:hidden">
            ← Retour
          </button>
        ) : (
          <Link href="/" style={{ fontSize: 14, color: "#666", textDecoration: "none" }} className="md:hidden">Retour</Link>
        )}
      </nav>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <div className={`${showList ? "flex" : "hidden"} md:flex`} style={{ width: 340, background: "white", borderRight: "1px solid #ebebeb", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f0f0" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>Messages</h2>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 16 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f0f0f0", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, background: "#f0f0f0", borderRadius: 4, marginBottom: 8, width: "60%" }} />
                      <div style={{ height: 12, background: "#f5f5f5", borderRadius: 4, width: "80%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <p style={{ color: "#999", fontSize: 14 }}>Aucune conversation pour le moment.</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setActiveConversation(conv.id); setActiveConv(conv); setShowList(false); setNewMessage(""); setBooking(null); setBookingPhotos([]); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
                    background: activeConversation === conv.id ? "#f5f0ff" : "white",
                    borderLeft: activeConversation === conv.id ? "3px solid #7C3AED" : "3px solid transparent",
                    borderBottom: "1px solid #f5f5f5", borderTop: "none", borderRight: "none",
                    cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ede9fe", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {conv.other_avatar ? (
                        <img src={conv.other_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 18, fontWeight: 600, color: "#7C3AED" }}>{conv.other_username[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    {conv.unread_count > 0 && (
                      <span style={{ position: "absolute", top: -2, right: -2, width: 18, height: 18, background: "#7C3AED", color: "white", borderRadius: "50%", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: conv.unread_count > 0 ? 700 : 500, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.other_username}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.listing_title}
                    </p>
                    {conv.last_message && (
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: conv.unread_count > 0 ? "#7C3AED" : "#bbb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: conv.unread_count > 0 ? 600 : 400 }}>
                        {conv.last_message.slice(0, 40)}{conv.last_message.length > 40 ? "..." : ""}
                      </p>
                    )}
                  </div>
                  {conv.listing_photo && (
                    <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <img src={conv.listing_photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Zone chat */}
        <div className={`${!showList ? "flex" : "hidden"} md:flex`} style={{ flex: 1, flexDirection: "column", overflow: "hidden" }}>
          {!activeConversation ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f5f0ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p style={{ color: "#999", fontSize: 14, margin: 0 }}>Sélectionne une conversation</p>
            </div>
          ) : (
            <>
              {/* Header */}
              {currentConv && (
                <div style={{ background: "white", borderBottom: "1px solid #ebebeb", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#ede9fe", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {currentConv.other_avatar ? (
                      <img src={currentConv.other_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 600, color: "#7C3AED" }}>{currentConv.other_username[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{currentConv.other_username}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentConv.listing_title}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {booking && (
                      <>
                        <button
                          onClick={() => setShowPhotos(!showPhotos)}
                          style={{ background: "#f5f0ff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#7C3AED", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          📸 Photos ({bookingPhotos.length})
                        </button>
                        <button
                          onClick={() => setShowPhotoModal(true)}
                          style={{ background: "#7C3AED", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "white", fontWeight: 600, cursor: "pointer" }}
                        >
                          + Photo
                        </button>
                      </>
                    )}
                    {currentConv.listing_photo && (
                      <Link href={`/listings/${currentConv.listing_id}`}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                          <img src={currentConv.listing_photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Photos panel */}
              {showPhotos && bookingPhotos.length > 0 && (
                <div style={{ background: "#faf8ff", borderBottom: "1px solid #e0d4ff", padding: "12px 20px" }}>
                  {pickupPhotos.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", margin: "0 0 8px" }}>📸 Photos de réception</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {pickupPhotos.map(p => (
                          <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                            <img src={p.url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "2px solid #e0d4ff" }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {returnPhotos.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", margin: "0 0 8px" }}>📸 Photos de restitution</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {returnPhotos.map(p => (
                          <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                            <img src={p.url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "2px solid #e0d4ff" }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
                {messages.length === 0 && (
                  <p style={{ textAlign: "center", color: "#ccc", fontSize: 13, marginTop: 32 }}>Commence la conversation !</p>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user?.id;
                  const isBooking = msg.content.startsWith('"') && msg.content.includes("est louée du");
                  const isPhoto = msg.content.startsWith("📸 Photo de");
                  const showTime = idx === 0 || new Date(msg.created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 300000;

                  if (isBooking) {
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
                        <div style={{ background: "white", border: "1px solid #e0d4ff", borderRadius: 12, padding: "14px 16px", maxWidth: 360, boxShadow: "0 1px 4px rgba(124,58,237,0.08)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f5f0ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#7C3AED" }}>Confirmation de réservation</span>
                          </div>
                          <p style={{ fontSize: 12, color: "#555", margin: 0, lineHeight: 1.6 }}>{msg.content}</p>
                          <p style={{ fontSize: 11, color: "#bbb", margin: "8px 0 0", fontWeight: 500 }}>Luxora</p>
                        </div>
                      </div>
                    );
                  }

                  if (isPhoto) {
                    const urlMatch = msg.content.match(/https?:\/\/\S+/);
                    const photoUrl = urlMatch ? urlMatch[0] : null;
                    const label = msg.content.includes("réception") ? "réception" : "restitution";
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 8 }}>
                        <div style={{ maxWidth: "60%" }}>
                          <p style={{ fontSize: 11, color: "#999", margin: "0 0 4px", textAlign: isMe ? "right" : "left" }}>📸 Photo de {label}</p>
                          {photoUrl && (
                            <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                              <img src={photoUrl} alt="" style={{ width: "100%", borderRadius: 12, border: "2px solid #e0d4ff", cursor: "pointer" }} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", margin: "12px 0 8px" }}>
                          {formatTime(msg.created_at)}
                        </p>
                      )}
                      <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 4 }}>
                        <div style={{
                          maxWidth: "72%", padding: "10px 14px",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          background: isMe ? "#7C3AED" : "white",
                          color: isMe ? "white" : "#1a1a1a",
                          fontSize: 14, lineHeight: 1.5,
                          boxShadow: isMe ? "none" : "0 1px 2px rgba(0,0,0,0.08)",
                          border: isMe ? "none" : "1px solid #ebebeb",
                          wordBreak: "break-word",
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ background: "white", borderTop: "1px solid #ebebeb", padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Écrire un message..."
                  rows={1}
                  style={{
                    flex: 1, padding: "10px 14px", border: "1.5px solid #e0d4ff", borderRadius: 24,
                    fontSize: 14, color: "#1a1a1a", background: "#faf8ff", resize: "none", outline: "none",
                    fontFamily: "inherit", lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: newMessage.trim() ? "#7C3AED" : "#e0d4ff",
                    border: "none", cursor: newMessage.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "background 0.15s",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Popup upload photo */}
      {showPhotoModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 24, maxWidth: 360, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: "0 0 16px" }}>Ajouter une photo</h3>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 16px" }}>Sélectionne le type de photo :</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => setPhotoType("pickup")}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `2px solid ${photoType === "pickup" ? "#7C3AED" : "#e0e0e0"}`, background: photoType === "pickup" ? "#f5f0ff" : "white", color: photoType === "pickup" ? "#7C3AED" : "#555", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                📦 Réception
              </button>
              <button
                onClick={() => setPhotoType("return")}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `2px solid ${photoType === "return" ? "#7C3AED" : "#e0e0e0"}`, background: photoType === "return" ? "#f5f0ff" : "white", color: photoType === "return" ? "#7C3AED" : "#555", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                🔄 Restitution
              </button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowPhotoModal(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #e0e0e0", background: "white", color: "#555", fontSize: 13, cursor: "pointer" }}>
                Annuler
              </button>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "#7C3AED", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                {uploadingPhoto ? "Upload..." : "Choisir une photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#999", fontSize: 14 }}>Chargement...</p></div>}>
      <MessagesContent />
    </Suspense>
  );
}
