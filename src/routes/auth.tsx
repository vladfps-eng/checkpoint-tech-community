import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CheckPoint" },
      {
        name: "description",
        content: "Sign in or create your CheckPoint account to post reviews and join the community.",
      },
      { property: "og:title", content: "Sign in — CheckPoint" },
      {
        property: "og:description",
        content: "Sign in or create your CheckPoint account to post reviews and join the community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

async function socialSignIn(provider: "google" | "lovable") {
  const result = await lovable.auth.signInWithOAuth(provider, {
    redirect_uri: window.location.origin,
  });
  if (result.error) {
    toast.error(result.error.message || "Sign-in failed");
    return;
  }
  if (result.redirected) return;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username.trim(), display_name: username.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created! Check your email to confirm your address, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Welcome back!");
          void navigate({ to: "/" });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="panel-card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">
          {mode === "signin" ? "Sign in to CheckPoint" : "Create your account"}
        </h1>
        <p className="text-sm text-muted mt-1">
          {mode === "signin"
            ? "Welcome back. Enter your details below."
            : "Pick a username — it appears next to your reviews and posts."}
        </p>

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() => void socialSignIn("google")}
            className="w-full py-2.5 btn-outline text-sm cursor-pointer"
          >
            Continue with Google
          </button>
          <button
            type="button"
            className="lovable-auth-button w-full"
            onClick={() => void socialSignIn("lovable")}
          >
            Continue with Lovable
          </button>
        </div>

        <div className="flex items-center gap-3 my-6 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          or with email
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm mb-1.5" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={24}
                pattern="[A-Za-z0-9_]+"
                title="Letters, numbers and underscores only"
                placeholder="e.g. vlad_fps"
                className="w-full rounded-md bg-panel-2 border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          )}
          <div>
            <label className="block text-sm mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-md bg-panel-2 border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full rounded-md bg-panel-2 border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <button type="submit" disabled={busy} className="w-full py-2.5 btn-accent text-sm disabled:opacity-60 cursor-pointer">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          {mode === "signin" ? "New to CheckPoint?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-accent hover:underline cursor-pointer"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
