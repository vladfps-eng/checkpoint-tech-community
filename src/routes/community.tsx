import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { myLikesQuery, postsQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, SectionHeader, timeAgo } from "@/components/bits";
import type { PostWithMeta } from "@/lib/types";

export const Route = createFileRoute("/community")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(postsQuery());
  },
  head: () => ({
    meta: [
      { title: "Community Wall — CheckPoint" },
      {
        name: "description",
        content: "Post your builds, ask for advice and debate the latest hardware with the CheckPoint community.",
      },
      { property: "og:title", content: "Community Wall — CheckPoint" },
      {
        property: "og:description",
        content: "Post your builds, ask for advice and debate the latest hardware.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityPage,
});

function Composer() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  if (!session) {
    return (
      <div className="panel-card p-5 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted">Sign in to post on the wall, like and comment.</p>
        <Link to="/auth" className="px-4 py-2 btn-accent text-sm">
          Sign in
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("posts").insert({ author_id: session.user.id, content: text });
      if (error) {
        toast.error(error.message);
        return;
      }
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel-card p-4 flex gap-3 items-start">
      <Avatar name={session.user.email ?? "You"} size={36} />
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="What's on your mind? Builds, upgrades, hot takes…"
          className="w-full rounded-md bg-panel-2 border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted">{content.length}/2000</span>
          <button type="submit" disabled={busy || !content.trim()} className="px-4 py-2 btn-accent text-sm disabled:opacity-60 cursor-pointer">
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}

function PostCard({ post }: { post: PostWithMeta }) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  const myLikes = useQuery(myLikesQuery(!!session));
  const liked = !!session && (myLikes.data ?? []).includes(post.id);

  const toggleLike = async () => {
    if (!session) {
      toast("Sign in to like posts");
      return;
    }
    try {
      if (liked) {
        const { error } = await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", session.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_likes").insert({ post_id: post.id, user_id: session.user.id });
        if (error) throw error;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
        queryClient.invalidateQueries({ queryKey: ["myLikes"] }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast("Sign in to comment");
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("comments").insert({ post_id: post.id, author_id: session.user.id, content: text });
      if (error) throw error;
      setCommentText("");
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="panel-card p-5">
      <div className="flex items-center gap-3">
        <Avatar name={post.author?.display_name ?? "CheckPoint Team"} url={post.author?.avatar_url} />
        <div>
          <div className="text-sm font-medium">{post.author?.display_name ?? "CheckPoint Team"}</div>
          <div className="text-xs text-muted">{timeAgo(post.created_at)}</div>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{post.content}</p>
      <div className="mt-4 flex items-center gap-4 text-sm text-muted">
        <button
          onClick={() => void toggleLike()}
          className={"flex items-center gap-1.5 transition-colors cursor-pointer " + (liked ? "text-accent" : "hover:text-foreground")}
        >
          <span>{liked ? "♥" : "♡"}</span>
          <span>{post.likes.length}</span>
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
        >
          <span>💬</span>
          <span>{post.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 border-t border-border pt-4 space-y-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-3 text-sm">
              <Avatar name={c.author?.display_name ?? "Ex-member"} url={c.author?.avatar_url} size={28} />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">{c.author?.display_name ?? "Ex-member"}</span>
                  <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-muted mt-0.5 whitespace-pre-line">{c.content}</p>
              </div>
            </div>
          ))}
          {post.comments.length === 0 && <p className="text-xs text-muted">No comments yet.</p>}
          <form onSubmit={addComment} className="flex gap-2 pt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={1000}
              placeholder={session ? "Add a comment…" : "Sign in to comment"}
              className="flex-1 rounded-md bg-panel-2 border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <button type="submit" disabled={busy || !session || !commentText.trim()} className="px-3 py-2 btn-accent text-sm disabled:opacity-60 cursor-pointer">
              Send
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function CommunityPage() {
  const { data: posts } = useSuspenseQuery(postsQuery());

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <SectionHeader title="Community wall" subtitle="Builds, upgrades and hardware debates" />
      <div className="space-y-4">
        <Composer />
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {posts.length === 0 && <p className="text-muted text-sm py-12 text-center">The wall is empty. Be the first to post!</p>}
      </div>
    </div>
  );
}
