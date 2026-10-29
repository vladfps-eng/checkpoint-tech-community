import type { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={"inline-flex items-center gap-0.5 " + className} aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-gold" : "text-border-strong"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function timeAgo(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function Avatar({
  name,
  url,
  size = 36,
}: {
  name: string | null | undefined;
  url: string | null | undefined;
  size?: number;
}) {
  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? "avatar"}
        width={size}
        height={size}
        className="rounded-full object-cover border border-border"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full bg-panel-2 border border-border grid place-items-center text-xs font-semibold text-muted"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {subtitle ? <p className="text-muted text-sm mt-1">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Chip({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "accent" }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border " +
        (tone === "accent"
          ? "border-accent/40 text-accent bg-accent/10"
          : "border-border text-muted bg-panel-2")
      }
    >
      {children}
    </span>
  );
}
