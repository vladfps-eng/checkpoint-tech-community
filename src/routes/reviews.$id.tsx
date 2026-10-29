import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { reviewQuery } from "@/lib/queries";
import { Avatar, Chip, Stars, timeAgo } from "@/components/bits";

export const Route = createFileRoute("/reviews/$id")({
  loader: async ({ context, params }) => {
    const review = await context.queryClient.ensureQueryData(reviewQuery(params.id));
    if (!review) throw notFound();
    return { review };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.review.title} — CheckPoint` : "Review — CheckPoint" },
      {
        name: "description",
        content: loaderData?.review.summary ?? "Hardware review on CheckPoint",
      },
      { property: "og:title", content: loaderData ? `${loaderData.review.title} — CheckPoint` : "Review — CheckPoint" },
      {
        property: "og:description",
        content: loaderData?.review.summary ?? "Hardware review on CheckPoint",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewDetail,
});

function ReviewDetail() {
  const { review } = Route.useLoaderData();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/reviews" className="text-sm text-accent hover:underline">
        ← All reviews
      </Link>
      <div className="flex items-center gap-3 mt-6 mb-3">
        <Chip>{review.category}</Chip>
        {review.brand ? <Chip>{review.brand}</Chip> : null}
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{review.title}</h1>
      <div className="flex items-center gap-3 mt-4 text-sm text-muted">
        <Avatar name={review.author?.display_name ?? "CheckPoint Team"} url={review.author?.avatar_url} size={32} />
        <span className="font-medium text-foreground">
          {review.author?.display_name ?? "CheckPoint Team"}
        </span>
        <span>· {timeAgo(review.created_at)}</span>
        <Stars rating={review.rating} className="ml-auto" />
      </div>
      <p className="mt-6 text-lg text-muted border-l-2 border-accent pl-4">{review.summary}</p>
      <div className="mt-8 space-y-4 leading-relaxed whitespace-pre-line">
        {review.content.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      <div className="panel-card p-5 mt-10 text-sm text-muted">
        <span className="text-foreground font-medium">Tested product:</span> {review.product_name}
      </div>
    </article>
  );
}
