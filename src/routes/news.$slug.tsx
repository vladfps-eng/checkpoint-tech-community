import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { newsItemQuery } from "@/lib/queries";
import { Chip, timeAgo } from "@/components/bits";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ context, params }) => {
    const item = await context.queryClient.ensureQueryData(newsItemQuery(params.slug));
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.item.title} — CheckPoint` : "News — CheckPoint" },
      { name: "description", content: loaderData?.item.summary ?? "Tech news on CheckPoint" },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.item.title} — CheckPoint` : "News — CheckPoint",
      },
      { property: "og:description", content: loaderData?.item.summary ?? "Tech news on CheckPoint" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewsDetail,
});

function NewsDetail() {
  const { item } = Route.useLoaderData();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/news" className="text-sm text-accent hover:underline">
        ← All news
      </Link>
      <div className="flex items-center gap-3 mt-6 mb-3">
        <Chip>{item.category}</Chip>
        <span className="text-xs text-muted">{timeAgo(item.published_at)}</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{item.title}</h1>
      <p className="mt-4 text-lg text-muted border-l-2 border-accent pl-4">{item.summary}</p>
      <div className="mt-8 space-y-4 leading-relaxed">
        {item.content.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}
