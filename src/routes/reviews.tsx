import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { reviewsQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, Chip, SectionHeader, Stars, timeAgo } from "@/components/bits";

const CATEGORIES = ["All", "Placas de vídeo", "Processadores", "Monitores", "Armazenamento", "Periféricos"];

export const Route = createFileRoute("/reviews")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(reviewsQuery());
  },
  head: () => ({
    meta: [
      { title: "Hardware Reviews — CheckPoint" },
      {
        name: "description",
        content:
          "Bench-tested reviews of GPUs, CPUs, monitors, SSDs and peripherals, scored by the CheckPoint community.",
      },
      { property: "og:title", content: "Hardware Reviews — CheckPoint" },
      {
        property: "og:description",
        content: "Bench-tested reviews of GPUs, CPUs, monitors, SSDs and peripherals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewsPage,
});

function WriteReviewCard() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    product_name: "",
    brand: "",
    category: CATEGORIES[1] ?? "",
    title: "",
    summary: "",
    content: "",
    rating: 4,
  });

  if (!session) {
    return (
      <div className="panel-card p-5 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted">Have gear to score? Sign in to publish your own review.</p>
        <Link to="/auth" className="px-4 py-2 btn-accent text-sm">
          Sign in to review
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        author_id: session.user.id,
        product_name: form.product_name.trim(),
        brand: form.brand.trim() || null,
        category: form.category,
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content.trim(),
        rating: form.rating,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Review published!");
      setOpen(false);
      setForm({ ...form, product_name: "", brand: "", title: "", summary: "", content: "" });
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full rounded-md bg-panel-2 border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent";

  return (
    <div>
      <button onClick={() => setOpen(true)} className="px-4 py-2 btn-accent text-sm cursor-pointer">
        Write a review
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="panel-card p-6 w-full max-w-xl space-y-4 my-8"
          >
            <h3 className="text-lg font-semibold">Publish a review</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="Product name"
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                className={field}
              />
              <input
                placeholder="Brand (optional)"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className={field}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={field}
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                className={field}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)} ({n}/5)
                  </option>
                ))}
              </select>
            </div>
            <input
              required
              placeholder="Review title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={field}
            />
            <textarea
              required
              rows={2}
              placeholder="Short summary shown in listings"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className={field}
            />
            <textarea
              required
              rows={6}
              placeholder="Full review — your test setup, results and verdict"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className={field}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 btn-outline text-sm cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="px-4 py-2 btn-accent text-sm disabled:opacity-60 cursor-pointer">
                {busy ? "Publishing…" : "Publish review"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ReviewsPage() {
  const { data: reviews } = useSuspenseQuery(reviewsQuery());
  const [category, setCategory] = useState("All");

  const filtered = category === "All" ? reviews : reviews.filter((r) => r.category === category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeader
        title="Hardware reviews"
        subtitle="Scored on our bench, argued about on the wall"
        action={<WriteReviewCard />}
      />

      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={
              "px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer " +
              (category === c
                ? "border-accent text-accent bg-accent/10"
                : "border-border text-muted hover:text-foreground")
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Link
            key={r.id}
            to="/reviews/$id"
            params={{ id: r.id }}
            className="panel-card p-5 flex flex-col gap-3 hover:border-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <Chip>{r.category}</Chip>
              <Stars rating={r.rating} />
            </div>
            <h3 className="text-lg font-semibold leading-snug">{r.title}</h3>
            <p className="text-sm text-muted line-clamp-3">{r.summary}</p>
            <div className="mt-auto text-xs text-muted flex items-center gap-2 pt-2">
              <Avatar name={r.author?.display_name ?? "CheckPoint Team"} url={r.author?.avatar_url} size={24} />
              <span>{r.author?.display_name ?? "CheckPoint Team"}</span>
              <span>· {timeAgo(r.created_at)}</span>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-muted text-sm py-12 text-center">No reviews in this category yet.</p>
      )}
    </div>
  );
}
