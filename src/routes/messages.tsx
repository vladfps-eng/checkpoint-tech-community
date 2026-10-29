import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { conversationsQuery, messagesQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, SectionHeader, timeAgo } from "@/components/bits";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — CheckPoint" },
      {
        name: "description",
        content: "Private messages between CheckPoint members.",
      },
      { property: "og:title", content: "Messages — CheckPoint" },
      { property: "og:description", content: "Private messages between CheckPoint members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { session, profile, loading } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="h-40 rounded-xl bg-panel animate-pulse" />
      </div>
    );
  }

  if (!session || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="panel-card p-8">
          <h1 className="text-xl font-bold">Private messages</h1>
          <p className="text-sm text-muted mt-2">Sign in to chat with other CheckPoint members.</p>
          <Link to="/auth" className="inline-block px-5 py-2.5 mt-5 btn-accent text-sm">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return <Chat uid={session.user.id} activeId={activeId} setActiveId={setActiveId} />;
}

function Chat({ uid, activeId, setActiveId }: { uid: string; activeId: string | null; setActiveId: (id: string | null) => void }) {
  const conversations = useQuery(conversationsQuery(true));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeader title="Messages" subtitle="Private conversations with other members" />
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <aside className="panel-card p-3 flex flex-col gap-2 self-start">
          <NewConversation onCreated={setActiveId} />
          <div className="space-y-1">
            {conversations.data?.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors cursor-pointer " +
                  (activeId === c.id ? "bg-accent/10 border border-accent/40" : "hover:bg-panel-2 border border-transparent")
                }
              >
                <Avatar name={c.other?.display_name ?? "Member"} size={32} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.other?.display_name ?? "Member"}</span>
                  <span className="block truncate text-xs text-muted">@{c.other?.username ?? "member"}</span>
                </span>
              </button>
            ))}
            {conversations.data && conversations.data.length === 0 && (
              <p className="text-xs text-muted px-2 py-3">No conversations yet. Start one above.</p>
            )}
          </div>
        </aside>
        <Thread uid={uid} conversationId={activeId} />
      </div>
    </div>
  );
}

function NewConversation({ onCreated }: { onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = username.trim().replace(/^@/, "").toLowerCase();
    if (!target) return;
    if (target === profile?.username) {
      toast.error("That's you 🙂");
      return;
    }
    setBusy(true);
    try {
      const { data: other, error } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("username", target)
        .maybeSingle();
      if (error) throw error;
      if (!other) {
        toast.error(`No member named "${target}"`);
        return;
      }
      const a = profile!.id < other.id ? profile!.id : other.id;
      const b = profile!.id < other.id ? other.id : profile!.id;
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_a", a)
        .eq("user_b", b)
        .maybeSingle();
      if (existing) {
        onCreated(existing.id);
      } else {
        const { data: created, error: insertError } = await supabase
          .from("conversations")
          .insert({ user_a: a, user_b: b })
          .select("id")
          .single();
        if (insertError) throw insertError;
        onCreated(created.id);
      }
      setUsername("");
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start conversation");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={start} className="flex gap-2 pb-2 mb-1 border-b border-border">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="@username"
        className="min-w-0 flex-1 rounded-md bg-panel-2 border border-border px-2.5 py-2 text-sm focus:outline-none focus:border-accent"
      />
      <button type="submit" disabled={busy} className="px-3 py-2 btn-accent text-xs shrink-0 disabled:opacity-60 cursor-pointer">
        Chat
      </button>
    </form>
  );
}

function Thread({ uid, conversationId }: { uid: string; conversationId: string | null }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = useQuery(messagesQuery(conversationId));

  const otherName = useMemo(() => {
    const first = messages.data?.find((m) => m.sender_id !== uid)?.sender?.display_name;
    return first ?? "Conversation";
  }, [messages.data, uid]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !conversationId) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: uid, content });
      if (error) throw error;
      setText("");
      await queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Message failed to send");
    } finally {
      setBusy(false);
    }
  };

  if (!conversationId) {
    return (
      <div className="panel-card grid place-items-center p-12 text-sm text-muted min-h-[420px]">
        Select a conversation, or start a new one with a member's @username.
      </div>
    );
  }

  return (
    <div className="panel-card flex flex-col min-h-[420px]">
      <div className="px-4 py-3 border-b border-border text-sm font-medium">{otherName}</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[520px]">
        {messages.isLoading && <p className="text-xs text-muted">Loading…</p>}
        {messages.data?.map((m) => {
          const mine = m.sender_id === uid;
          return (
            <div key={m.id} className={"flex gap-2 " + (mine ? "justify-end" : "justify-start")}>
              {!mine && <Avatar name={m.sender?.display_name ?? "Member"} size={28} />}
              <div
                className={
                  "max-w-[75%] rounded-xl px-3.5 py-2 text-sm " +
                  (mine ? "bg-accent text-accent-foreground" : "bg-panel-2 border border-border")
                }
              >
                <p className="whitespace-pre-line">{m.content}</p>
                <div className={"text-[10px] mt-1 " + (mine ? "text-accent-foreground/70" : "text-muted")}>
                  {timeAgo(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        {messages.data && messages.data.length === 0 && (
          <p className="text-xs text-muted text-center py-8">Say hello 👋</p>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 p-3 border-t border-border">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="Write a message…"
          className="flex-1 rounded-md bg-panel-2 border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        <button type="submit" disabled={busy || !text.trim()} className="px-4 py-2 btn-accent text-sm disabled:opacity-60 cursor-pointer">
          Send
        </button>
      </form>
    </div>
  );
}
