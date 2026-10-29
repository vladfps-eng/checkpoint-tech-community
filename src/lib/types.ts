import type { Database } from "@/integrations/supabase/types";

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type NewsItem = Database["public"]["Tables"]["news_items"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type CommentWithAuthor = {
  id: string;
  post_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
  author: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
};

export type PostWithMeta = Post & {
  author: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
  likes: { user_id: string }[];
  comments: CommentWithAuthor[];
};

export type ReviewWithAuthor = Review & {
  author: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
};

export type Conversation = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

export type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  sender: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
};
