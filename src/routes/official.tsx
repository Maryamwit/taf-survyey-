import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { OfficialDocument } from "@/components/OfficialDocument";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { DRAFT_KEY, emptySurvey, type SurveyData } from "@/lib/survey";

export const Route = createFileRoute("/official")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s["id"] === "string" ? { id: s["id"] } : {}),
  head: () => ({
    meta: [
      { title: "Official PDF – OF/SAM/019 | TAF ENERGIES PLC" },
      { name: "description", content: "A4 printable replica of form OF/SAM/019, filled with survey answers." },
      { property: "og:title", content: "Official PDF – OF/SAM/019" },
      { property: "og:description", content: "Printable A4 Customer Satisfaction Survey form." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OfficialPage,
});

function OfficialPage() {
  const { id } = Route.useSearch();
  const [data, setData] = useState<SurveyData>(emptySurvey);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (id) {
      if (!isSupabaseConfigured()) {
        setNote("Saved responses cannot be loaded until Supabase is connected.");
        return;
      }
      supabase.from("survey_responses").select("*").eq("id", id).maybeSingle().then(({ data: r }) => {
        if (!r) return setNote("Response not available (admin sign-in required).");
        setData({
          ...emptySurvey(),
          customer_name: r.customer_name ?? "",
          company_name: r.company_name ?? "",
          contact_info: r.contact_info ?? "",
          service_date: r.service_date ?? "",
          service_types: r.service_types ?? [],
          service_other: r.service_other ?? "",
          ratings: (r.ratings as Record<string, number>) ?? {},
          open_answers: (r.open_answers as Record<string, string>) ?? {},
          follow_up: r.follow_up,
          contact_methods: r.contact_methods ?? [],
          contact_other: r.contact_other ?? "",
        });
      });
    } else {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) setData({ ...emptySurvey(), ...JSON.parse(raw) });
      } catch {}
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-muted">
      <AppHeader
        active="pdf"
        actions={<button className="chrome-btn" onClick={() => window.print()}>🖨️ Print PDF</button>}
      />
      {note && <p className="no-print text-center text-sm text-danger py-3">{note}</p>}
      <OfficialDocument data={data} />
    </div>
  );
}
