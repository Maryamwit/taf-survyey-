import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import { DRAFT_KEY, RATING_IDS, S1, S2, S3, S4, S5, emptySurvey, type SurveyData } from "@/lib/survey";
import { missingRequiredRatings, responseAverage } from "@/lib/stats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "የደንበኛ እርካታ የዳሰሳ ጥናት መጠይቅ ቅጽ – TAF ENERGIES PLC" },
      { name: "description", content: "TAF ENERGIES PLC Customer Satisfaction Survey Questionary Form (OF/SAM/019)." },
      { property: "og:title", content: "TAF ENERGIES PLC – Customer Satisfaction Survey" },
      { property: "og:description", content: "Share your feedback with TAF ENERGIES PLC (OF/SAM/019)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SurveyPage,
});

const RATING_COLORS: Record<number, string> = {
  1: "bg-r1 border-r1",
  2: "bg-r2 border-r2",
  3: "bg-r3 border-r3",
  4: "bg-r4 border-r4",
  5: "bg-r5 border-r5",
};

function SurveyPage() {
  const [data, setData] = useState<SurveyData>(emptySurvey);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setData({ ...emptySurvey(), ...JSON.parse(raw) });
    } catch {}
  }, []);

  const set = <K extends keyof SurveyData>(k: K, v: SurveyData[K]) => setData((d) => ({ ...d, [k]: v }));
  const toggle = (k: "service_types" | "contact_methods", v: string) =>
    setData((d) => ({ ...d, [k]: d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v] }));
  const setOpen = (id: string, v: string) => setData((d) => ({ ...d, open_answers: { ...d.open_answers, [id]: v } }));

  const missing = missingRequiredRatings(data.ratings);
  const answered = RATING_IDS.length - missing.length;
  const progress = useMemo(() => {
    let filled = answered;
    let total = RATING_IDS.length + 2 + 9;
    if (data.service_date) filled++;
    if (data.service_types.length) filled++;
    [...S3.questions, ...S4.questions].forEach(([id]) => (data.open_answers[id] ?? "").trim() && filled++);
    return Math.round((filled / total) * 100);
  }, [data, answered]);
  const avg = responseAverage(data.ratings);

  const save = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    toast.success("Saved on this device");
  };
  const clear = () => {
    if (!confirm("Clear the whole form?")) return;
    localStorage.removeItem(DRAFT_KEY);
    setData(emptySurvey());
    setShowErrors(false);
  };

  const submit = async () => {
    if (!isSupabaseConfigured()) {
      toast.error(
        "Online submission is unavailable. Please ask the administrator to connect Supabase.",
      );
      return;
    }
    if (missing.length) {
      setShowErrors(true);
      toast.error(`ክፍል 2: ${missing.join(", ")}`);
      document.getElementById(`q-${missing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    const followUp = data.follow_up === true;
    const { error } = await supabase.from("survey_responses").insert({
      customer_name: data.customer_name.trim() || null,
      company_name: data.company_name.trim() || null,
      contact_info: data.contact_info.trim() || null,
      service_date: data.service_date || null,
      service_types: data.service_types,
      service_other: data.service_types.includes(S1.other) ? data.service_other.trim() || null : null,
      ratings: data.ratings,
      open_answers: data.open_answers,
      follow_up: data.follow_up,
      contact_methods: followUp ? data.contact_methods : [],
      contact_other: followUp ? data.contact_other.trim() || null : null,
    });
    setSubmitting(false);
    if (error) {
      console.error("[submit error]", error.code, error.message, error.details, error.hint);
      toast.error(`Could not submit: ${error.message}`);
      return;
    }
    localStorage.removeItem(DRAFT_KEY);
    qc.invalidateQueries({ queryKey: ["public-stats"] });
    setSubmitted(true);
    window.scrollTo({ top: 0 });
  };

  const actions = (
    <>
      <button className="chrome-btn" onClick={save}>💾 Save</button>
      <button className="chrome-btn" onClick={clear}>🔄 Clear Form</button>
    </>
  );

  if (submitted) {
    return (
      <div className="min-h-screen">
        <AppHeader active="form" />
        <main className="mx-auto max-w-xl px-4 py-16">
          <div className="card-surface p-8 text-center space-y-4">
            <div className="mx-auto h-20 w-20 rounded-full bg-success-soft text-success grid place-items-center text-4xl">✓</div>
            <h1 className="font-ethiopic text-3xl font-extrabold">እናመሰግናለን!</h1>
            <p className="text-muted-foreground font-ethiopic">TAF ENERGIES PLC</p>
            <button
              className="mt-2 inline-flex min-h-12 items-center rounded-lg bg-navy px-6 font-semibold text-navy-foreground"
              onClick={() => { setData(emptySurvey()); setSubmitted(false); setShowErrors(false); }}
            >
              📋 Survey Form
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <AppHeader active="form" actions={actions} />
      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-5 space-y-5 font-ethiopic">
        {/* Summary card */}
        <section className="rounded-2xl bg-navy text-navy-foreground p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <ProgressRing value={progress} />
          <div className="flex-1 space-y-2">
            <h1 className="text-lg sm:text-xl font-bold leading-snug">የደንበኛ እርካታ የዳሰሳ ጥናት መጠይቅ ቅጽ</h1>
            <p className="text-sm text-navy-muted">CUSTOMER SATISFACTION SURVEY QUESTIONARY FORM · OF/SAM/019 · Issue 01</p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-md border border-success/50 bg-success/15 px-2 py-1 text-success">✓ {answered}/{RATING_IDS.length} ክፍል 2</span>
              <span className="rounded-md border border-primary/50 bg-primary/15 px-2 py-1 text-primary">★ {avg ? avg.toFixed(2) : "–"}</span>
            </div>
          </div>
        </section>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden" aria-label="progress">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Section 1 */}
        <SectionCard n={1} title={S1.title}>
          <Field label={S1.q1_1}><input className="inp" value={data.customer_name} onChange={(e) => set("customer_name", e.target.value)} /></Field>
          <Field label={S1.q1_2}><input className="inp" value={data.company_name} onChange={(e) => set("company_name", e.target.value)} /></Field>
          <Field label={S1.q1_3}><input className="inp" value={data.contact_info} onChange={(e) => set("contact_info", e.target.value)} /></Field>
          <Field label={S1.q1_4}><input type="date" className="inp" value={data.service_date} onChange={(e) => set("service_date", e.target.value)} /></Field>
          <Field label={S1.q1_5}>
            <div className="grid gap-2 sm:grid-cols-2">
              {[...S1.services, S1.other].map((s) => (
                <CheckTile key={s} checked={data.service_types.includes(s)} onClick={() => toggle("service_types", s)}>{s}</CheckTile>
              ))}
            </div>
            {data.service_types.includes(S1.other) && (
              <input className="inp mt-2" value={data.service_other} onChange={(e) => set("service_other", e.target.value)} aria-label={S1.other} />
            )}
          </Field>
        </SectionCard>

        {/* Section 2 */}
        <SectionCard n={2} title={S2.title} badge={`${answered}/${RATING_IDS.length}`}>
          <p className="text-sm text-muted-foreground leading-relaxed">{S2.intro}</p>
          <div className="divide-y divide-border">
            {S2.questions.map(([id, q]) => {
              const v = data.ratings[id];
              const err = showErrors && !v;
              return (
                <div key={id} id={`q-${id}`} className={`py-4 ${err ? "bg-danger-soft -mx-4 px-4 rounded-lg" : ""}`}>
                  <p className="font-semibold mb-3"><span className="text-primary mr-1">{id}</span>{q} <span className="text-danger">*</span></p>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const on = v === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setData((d) => ({ ...d, ratings: { ...d.ratings, [id]: n } }))}
                          className={`min-h-14 rounded-xl border-2 flex flex-col items-center justify-center transition active:scale-95 ${
                            on ? `${RATING_COLORS[n]} text-card shadow-md` : "border-border bg-card hover:bg-secondary"
                          }`}
                          aria-pressed={on}
                        >
                          <span className="text-xl font-extrabold leading-none">{n}</span>
                          <span className={`text-[10px] mt-1 leading-tight ${on ? "" : "text-muted-foreground"}`}>{S2.scale[n]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard n={3} title={S3.title}>
          {S3.questions.map(([id, q]) => (
            <Field key={id} label={`${id} ${q}`}>
              <textarea className="inp min-h-28" value={data.open_answers[id] ?? ""} onChange={(e) => setOpen(id, e.target.value)} />
            </Field>
          ))}
        </SectionCard>

        <SectionCard n={4} title={S4.title}>
          {S4.questions.map(([id, q]) => (
            <Field key={id} label={`${id} ${q}`}>
              <textarea className="inp min-h-28" value={data.open_answers[id] ?? ""} onChange={(e) => setOpen(id, e.target.value)} />
            </Field>
          ))}
        </SectionCard>

        <SectionCard n={5} title={S5.title}>
          <Field label={S5.q5_1}>
            <div className="grid grid-cols-2 gap-2">
              <CheckTile checked={data.follow_up === true} onClick={() => set("follow_up", data.follow_up === true ? null : true)}>{S5.yes}</CheckTile>
              <CheckTile checked={data.follow_up === false} onClick={() => set("follow_up", data.follow_up === false ? null : false)}>{S5.no}</CheckTile>
            </div>
          </Field>
          {data.follow_up === true && (
            <Field label={S5.q5_2}>
              <div className="grid gap-2 sm:grid-cols-3">
                {[...S5.methods, S5.other].map((m) => (
                  <CheckTile key={m} checked={data.contact_methods.includes(m)} onClick={() => toggle("contact_methods", m)}>{m}</CheckTile>
                ))}
              </div>
              {data.contact_methods.includes(S5.other) && (
                <input className="inp mt-2" value={data.contact_other} onChange={(e) => set("contact_other", e.target.value)} aria-label={S5.other} />
              )}
            </Field>
          )}
        </SectionCard>
      </main>

      <div className="no-print fixed inset-x-0 bottom-0 border-t bg-card/95 backdrop-blur p-3">
        <div className="mx-auto max-w-4xl flex gap-3 items-center">
          <span className="text-sm text-muted-foreground font-semibold">{progress}%</span>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 min-h-13 py-3.5 rounded-xl bg-primary text-primary-foreground font-ethiopic text-lg font-bold shadow-lg disabled:opacity-60"
          >
            {submitting ? "…" : "ላክ ➜"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ n, title, badge, children }: { n: number; title: string; badge?: string; children: ReactNode }) {
  return (
    <section className="card-surface overflow-hidden">
      <div className="flex items-center gap-3 border-b bg-secondary/50 px-4 py-3.5">
        <span className="h-7 w-1.5 rounded-full bg-primary" />
        <span className="h-8 w-8 rounded-lg bg-navy text-navy-foreground grid place-items-center font-bold text-sm">{n}</span>
        <h2 className="flex-1 font-bold text-base sm:text-lg">{title}</h2>
        {badge && <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">{badge}</span>}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block font-semibold text-[15px]">{label}</span>
      {children}
    </label>
  );
}

function CheckTile({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 text-left font-semibold transition ${
        checked ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card hover:bg-secondary"
      }`}
    >
      <span className={`h-5 w-5 shrink-0 rounded border-2 grid place-items-center text-xs ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
        {checked ? "✓" : ""}
      </span>
      {children}
    </button>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
        <circle cx="36" cy="36" r={r} className="stroke-navy-2" strokeWidth="7" fill="none" />
        <circle cx="36" cy="36" r={r} className="stroke-primary transition-all" strokeWidth="7" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-bold">{value}%</span>
    </div>
  );
}
