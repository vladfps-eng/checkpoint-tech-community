import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation, Message, NewsItem, Post, PostWithMeta, Review, ReviewWithAuthor } from "./types";

const AUTHOR_FIELDS = "username, display_name, avatar_url";

export const reviewsQuery = () =>
  queryOptions({
    queryKey: ["reviews"],
    queryFn: async (): Promise<ReviewWithAuthor[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`*, author:profiles!reviews_author_id_fkey(${AUTHOR_FIELDS})`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReviewWithAuthor[];
    },
  });

export const reviewQuery = (id: string) =>
  queryOptions({
    queryKey: ["reviews", id],
    queryFn: async (): Promise<ReviewWithAuthor | null> => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`*, author:profiles!reviews_author_id_fkey(${AUTHOR_FIELDS})`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ReviewWithAuthor | null;
    },
  });

export const newsQuery = () =>
  queryOptions({
    queryKey: ["news"],
    queryFn: async (): Promise<NewsItem[]> => {
      const { data, error } = await supabase
        .from("news_items")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const newsItemQuery = (slug: string) =>
  queryOptions({
    queryKey: ["news", slug],
    queryFn: async (): Promise<NewsItem | null> => {
      const { data, error } = await supabase
        .from("news_items")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

export const postsQuery = () =>
  queryOptions({
    queryKey: ["posts"],
    queryFn: async (): Promise<PostWithMeta[]> => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `*, author:profiles!posts_author_id_fkey(${AUTHOR_FIELDS}), likes:post_likes(user_id), comments(id, post_id, author_id, content, created_at, author:profiles!comments_author_id_fkey(${AUTHOR_FIELDS}))`
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as PostWithMeta[];
    },
  });

export const myLikesQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["myLikes"],
    enabled,
    queryFn: async (): Promise<string[]> => {
      if (!enabled) return [];
      const { data, error } = await supabase.from("post_likes").select("post_id");
      if (error) throw error;
      return (data ?? []).map((l) => l.post_id);
    },
  });

export const conversationsQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["conversations"],
    enabled,
    queryFn: async (): Promise<(Conversation & { other: { username: string; display_name: string } | null })[]> => {
      if (!enabled) return [];
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `id, user_a, user_b, created_at,
           a:profiles!conversations_user_a_fkey(username, display_name),
           b:profiles!conversations_user_b_fkey(username, display_name)`
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const r = row as unknown as Conversation & {
          a: { username: string; display_name: string } | null;
          b: { username: string; display_name: string } | null;
        };
        const other = r.user_a === uid ? r.b : r.a;
        return { id: r.id, user_a: r.user_a, user_b: r.user_b, created_at: r.created_at, other };
      });
    },
  });

export const messagesQuery = (conversationId: string | null) =>
  queryOptions({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select(`*, sender:profiles!messages_sender_id_fkey(${AUTHOR_FIELDS})`)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Message[];
    },
  });

export const profileByUsernameQuery = (username: string) =>
  queryOptions({
    queryKey: ["profile", username],
    enabled: username.length > 0,
    queryFn: async (): Promise<Post.Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Post.Profile | null;
    },
  });
