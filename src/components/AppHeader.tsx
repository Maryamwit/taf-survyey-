import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";

type PublicStats = { responses: number; avg_rating: number | null; follow_ups: number };

export function usePublicStats() {
  return useQuery({
    queryKey: ["public-stats"],
    enabled: isSupabaseConfigured(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_stats");
      if (error) throw error;
      return data as unknown as PublicStats;
    },
    refetchInterval: 30000,
  });
}

function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    enabled: isSupabaseConfigured(),
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });
}

export function AppHeader({
  active,
  actions,
  subtitle = "Customer Satisfaction Survey — OF/SAM/019",
}: {
  active: "form" | "admin" | "qr";
  actions?: ReactNode;
  subtitle?: string;
}) {
  const { data } = usePublicStats();
  const { data: isAdmin } = useIsAdmin();
  return (
    <header className="no-print bg-navy text-navy-foreground">
      <div className="mx-auto max-w-6xl px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-lg bg-primary grid place-items-center overflow-hidden ring-2 ring-primary/40">
              <img src="/taf-logo.png" alt="TAF" className="h-9 w-9 rounded-md object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">TAF ENERGIES</span>
                <span className="hidden sm:inline rounded-md border border-primary/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Survey Portal
                </span>
              </div>
              <p className="text-xs text-navy-muted truncate">{subtitle}</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-1.5 rounded-full border border-navy-foreground/15 bg-navy-2/60 px-3 py-1.5 text-xs">
              <Chip label="Responses" value={data?.responses ?? "–"} />
              <Chip label="Average Rating" value={data?.avg_rating != null ? Number(data.avg_rating).toFixed(2) : "–"} accent />
              <Chip label="Follow-ups Requested" value={data?.follow_ups ?? "–"} />
            </div>
          )}
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <Link to="/" className="chrome-btn" data-active={active === "form"}>📋 Survey Form</Link>
          <Link to="/qr" className="chrome-btn" data-active={active === "qr"}>🔳 QR Poster</Link>
          {actions}
        </nav>
      </div>
    </header>
  );
}

function Chip({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <span className="px-1.5 whitespace-nowrap">
      <span className="text-navy-muted">{label}: </span>
      <b className={accent ? "text-primary" : ""}>{value}</b>
    </span>
  );
}
