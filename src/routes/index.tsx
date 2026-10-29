import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { newsQuery, postsQuery, reviewsQuery } from "@/lib/queries";
import { Avatar, Chip, SectionHeader, Stars, timeAgo } from "@/components/bits";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(reviewsQuery());
    void context.queryClient.ensureQueryData(newsQuery());
    void context.queryClient.ensureQueryData(postsQuery());
  },
  head: () => ({
    meta: [
      { title: "CheckPoint — Hardware Reviews, News & Community" },
      {
        name: "description",
        content:
          "In-depth hardware reviews, breaking tech news and a community of PC enthusiasts. GPUs, CPUs, monitors, SSDs and more.",
      },
      { property: "og:title", content: "CheckPoint — Hardware Reviews, News & Community" },
      {
        property: "og:description",
        content: "In-depth hardware reviews, breaking tech news and a community of PC enthusiasts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: reviews } = useSuspenseQuery(reviewsQuery());
  const { data: news } = useSuspenseQuery(newsQuery());
  const { data: posts } = useSuspenseQuery(postsQuery());

  const featured = [...reviews].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const trending = news.slice(0, 4);
  const wall = posts.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="grid-bg border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <Chip tone="accent">Hardware · Reviews · Community</Chip>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold leading-tight max-w-3xl">
            Bench-tested hardware reviews,
            <span className="text-accent"> real community verdicts.</span>
          </h1>
          <p className="mt-4 text-muted max-w-2xl">
            CheckPoint is where PC enthusiasts score the latest GPUs, CPUs, monitors and storage —
            and argue about it afterwards. Read the reviews, catch the news, join the wall.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/reviews" className="px-5 py-3 btn-accent text-sm">
              Browse reviews
            </Link>
            <Link to="/community" className="px-5 py-3 btn-outline text-sm">
              Join the community
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 space-y-16">
        {/* Featured reviews */}
        <section>
          <SectionHeader
            title="Featured reviews"
            subtitle="Highest-scoring gear from our test bench"
            action={
              <Link to="/reviews" className="text-sm text-accent hover:underline">
                All reviews →
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => (
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
        </section>

        {/* Trending news */}
        <section>
          <SectionHeader
            title="In high demand"
            subtitle="What the hardware world is talking about"
            action={
              <Link to="/news" className="text-sm text-accent hover:underline">
                All news →
              </Link>
            }
          />
          <div className="grid gap-4">
            {trending.map((n, i) => (
              <Link
                key={n.id}
                to="/news/$slug"
                params={{ slug: n.slug }}
                className="panel-card p-5 flex items-start gap-4 hover:border-accent/50 transition-colors"
              >
                <span className="font-display text-2xl text-accent/70 w-8 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Chip>{n.category}</Chip>
                    <span className="text-xs text-muted">{timeAgo(n.published_at)}</span>
                  </div>
                  <h3 className="font-semibold leading-snug">{n.title}</h3>
                  <p className="text-sm text-muted mt-1 line-clamp-2">{n.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Community wall preview */}
        <section>
          <SectionHeader
            title="Community wall"
            subtitle="Fresh posts from the CheckPoint community"
            action={
              <Link to="/community" className="text-sm text-accent hover:underline">
                Open the wall →
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {wall.map((p) => (
              <div key={p.id} className="panel-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar
                    name={p.author?.display_name ?? "CheckPoint Team"}
                    url={p.author?.avatar_url}
                    size={28}
                  />
                  <span className="font-medium">{p.author?.display_name ?? "CheckPoint Team"}</span>
                </div>
                <p className="text-sm text-muted line-clamp-4">{p.content}</p>
                <div className="mt-auto text-xs text-muted flex items-center gap-3">
                  <span>♥ {p.likes.length}</span>
                  <span>💬 {p.comments.length}</span>
                  <span>{timeAgo(p.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
