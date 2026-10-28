import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Sign In – TAF Survey Portal" },
      { name: "description", content: "Sign in to the TAF ENERGIES survey admin panel." },
      { property: "og:title", content: "Admin Sign In – TAF Survey Portal" },
      { property: "og:description", content: "Admin access for survey records." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      toast.error("Sign-in is unavailable. Please ask the administrator to connect Supabase.");
      return;
    }
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      navigate({ to: "/admin" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      if (data.session) navigate({ to: "/admin" });
      else toast.success("Check your email to confirm your account, then sign in.");
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader active="admin" />
      <main className="mx-auto max-w-md px-4 py-12">
        <form onSubmit={go} className="card-surface p-6 space-y-4">
          <h1 className="text-xl font-bold">🛡️ Admin {mode === "in" ? "Sign In" : "Create Account"}</h1>
          {!isSupabaseConfigured() && (
            <p
              role="alert"
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
            >
              Supabase is not connected. Admin sign-in is unavailable until the administrator configures it.
            </p>
          )}
          <input className="inp" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="inp" type="password" required minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} className="w-full min-h-12 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60">
            {busy ? "…" : mode === "in" ? "Sign In" : "Create Account"}
          </button>
          <button type="button" className="w-full text-sm text-muted-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "No account? Create one" : "Have an account? Sign in"}
          </button>
          <p className="text-xs text-muted-foreground">The first account created becomes the administrator.</p>
        </form>
      </main>
    </div>
  );
}
