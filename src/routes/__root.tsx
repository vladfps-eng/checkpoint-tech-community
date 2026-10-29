import { createRootRoute, Link, Outlet, HeadContent } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { ClientOnly } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import "@/styles.css";

function NavLink({ to, label }: { to: "/" | "/reviews" | "/news" | "/community" | "/messages"; label: string }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-md text-sm font-medium text-muted hover:text-foreground transition-colors [&.active]:text-accent"
      activeProps={{ className: "active" }}
    >
      {label}
    </Link>
  );
}

function AuthButton() {
  const { session, profile, loading, signOut } = useAuth();
  if (loading) return <div className="h-9 w-24 rounded-md bg-panel animate-pulse" />;
  if (session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/messages"
          className="hidden sm:inline-flex px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          Messages
        </Link>
        <button
          onClick={() => void signOut()}
          className="px-3 py-2 text-sm rounded-md btn-outline cursor-pointer"
          title={profile?.display_name ?? "Signed in"}
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <Link to="/auth" className="px-4 py-2 text-sm btn-accent inline-block">
      Sign in
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="inline-block h-8 w-8 rounded-md bg-accent text-accent-foreground font-display font-bold grid place-items-center text-lg">
            C
          </span>
          <span className="font-display font-bold text-lg tracking-wide">
            CHECK<span className="text-accent">POINT</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" label="Home" />
          <NavLink to="/reviews" label="Reviews" />
          <NavLink to="/news" label="News" />
          <NavLink to="/community" label="Community" />
          <NavLink to="/messages" label="Messages" />
        </nav>
        <ClientOnly>
          <AuthButton />
        </ClientOnly>
      </div>
      <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        <NavLink to="/" label="Home" />
        <NavLink to="/reviews" label="Reviews" />
        <NavLink to="/news" label="News" />
        <NavLink to="/community" label="Community" />
        <NavLink to="/messages" label="Messages" />
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <div className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded bg-accent text-accent-foreground font-display font-bold grid place-items-center text-sm">
            C
          </span>
          <span>CheckPoint — hardware reviews, news and community.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/reviews" className="hover:text-foreground transition-colors">
            Reviews
          </Link>
          <Link to="/news" className="hover:text-foreground transition-colors">
            News
          </Link>
          <Link to="/community" className="hover:text-foreground transition-colors">
            Community
          </Link>
        </div>
      </div>
    </footer>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CheckPoint" },
      {
        name: "description",
        content: "Hardware reviews, tech news and a community of enthusiasts.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Work+Sans:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <HeadContent />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <Toaster position="top-right" theme="dark" />
      </div>
    </AuthProvider>
  );
}

