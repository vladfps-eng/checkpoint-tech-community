import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { newsQuery } from "@/lib/queries";
import { Chip, SectionHeader, timeAgo } from "@/components/bits";

export const Route = createFileRoute("/news")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(newsQuery());
  },
  head: () => ({
    meta: [
      { title: "Tech News — CheckPoint" },
      {
        name: "description",
        content: "The latest hardware launches, specs and prices — CPUs, GPUs, storage and displays.",
      },
      { property: "og:title", content: "Tech News — CheckPoint" },
      { property: "og:description", content: "The latest hardware launches, specs and prices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data: news } = useSuspenseQuery(newsQuery());
  const [lead, ...rest] = news;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeader title="Tech news" subtitle="Launches, specs and prices that matter" />
      {lead && (
        <Link
          to="/news/$slug"
          params={{ slug: lead.slug }}
          className="panel-card p-6 sm:p-8 block hover:border-accent/50 transition-colors mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Chip tone="accent">Top story</Chip>
            <Chip>{lead.category}</Chip>
            <span className="text-xs text-muted">{timeAgo(lead.published_at)}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{lead.title}</h2>
          <p className="text-muted mt-3">{lead.summary}</p>
        </Link>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {rest.map((n) => (
          <Link
            key={n.id}
            to="/news/$slug"
            params={{ slug: n.slug }}
            className="panel-card p-5 flex flex-col gap-2 hover:border-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Chip>{n.category}</Chip>
              <span className="text-xs text-muted">{timeAgo(n.published_at)}</span>
            </div>
            <h3 className="font-semibold leading-snug">{n.title}</h3>
            <p className="text-sm text-muted line-clamp-3">{n.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
