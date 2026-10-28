import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { S1, S2, S3, S4, S5, RATING_IDS } from "@/lib/survey";
import { average, isOpenIssue, responseAverage, scoreStatus, type Status } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Survey Management & Enterprise Records – TAF" },
      { name: "description", content: "Admin dashboard for TAF customer satisfaction survey responses." },
      { property: "og:title", content: "Survey Management & Enterprise Records – TAF" },
      { property: "og:description", content: "KPIs, charts and records for OF/SAM/019 responses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Row = Tables<"survey_responses">;
const ratingsOf = (r: Row) => (r.ratings ?? {}) as Record<string, number>;
const openOf = (r: Row) => (r.open_answers ?? {}) as Record<string, string>;

const STATUS_TEXT: Record<Status, string> = { good: "text-success", fair: "text-warning", poor: "text-danger", none: "text-muted-foreground" };
const STATUS_BG: Record<Status, string> = { good: "bg-success-soft text-success", fair: "bg-warning-soft text-warning", poor: "bg-danger-soft text-danger", none: "bg-secondary text-muted-foreground" };
const STATUS_FILL: Record<Status, string> = { good: "var(--success)", fair: "var(--warning)", poor: "var(--danger)", none: "var(--muted-foreground)" };
const fmt = (n: number | null) => (n == null ? "–" : n.toFixed(2));

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id).eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });
  const rows = useQuery({
    queryKey: ["responses"],
    enabled: role.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("survey_responses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [tab, setTab] = useState<"records" | "followup">("records");
  const [q, setQ] = useState("");
  const [svc, setSvc] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<{ k: "date" | "avg" | "overall"; dir: 1 | -1 }>({ k: "date", dir: -1 });
  const [detail, setDetail] = useState<Row | null>(null);

  const all = rows.data ?? [];

  const kpi = useMemo(() => ({
    total: all.length,
    overall: average(all.map((r) => ratingsOf(r)["2.10"]).filter((n) => n != null)),
    follow: all.filter((r) => r.follow_up).length,
    open: all.filter((r) => isOpenIssue({ ratings: ratingsOf(r), open_answers: openOf(r), resolved: r.resolved })).length,
  }), [all]);

  const perQuestion = useMemo(() => RATING_IDS.map((id) => {
    const avg = average(all.map((r) => ratingsOf(r)[id]).filter((n) => n != null));
    return { id, avg: avg ? +avg.toFixed(2) : 0, status: scoreStatus(avg) };
  }), [all]);
  const distribution = useMemo(() => [1, 2, 3, 4, 5].map((n) => ({
    n: String(n), count: all.reduce((s, r) => s + Object.values(ratingsOf(r)).filter((v) => v === n).length, 0),
  })), [all]);
  const overTime = useMemo(() => {
    const m = new Map<string, number>();
    [...all].reverse().forEach((r) => { const d = r.created_at.slice(0, 10); m.set(d, (m.get(d) ?? 0) + 1); });
    return [...m].map(([date, count]) => ({ date, count }));
  }, [all]);
  const bySvc = useMemo(() => [...S1.services, S1.other].map((s) => ({ name: s, value: all.filter((r) => r.service_types.includes(s)).length })), [all]);

  const filtered = useMemo(() => {
    let list = all.filter((r) => {
      const hay = `${r.customer_name ?? ""} ${r.company_name ?? ""} ${r.contact_info ?? ""}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (svc !== "all" && !r.service_types.includes(svc)) return false;
      if (status !== "all" && scoreStatus(responseAverage(ratingsOf(r))) !== status) return false;
      return true;
    });
    const key = (r: Row) => sort.k === "date" ? r.created_at : sort.k === "avg" ? responseAverage(ratingsOf(r)) ?? 0 : ratingsOf(r)["2.10"] ?? 0;
    list = [...list].sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * sort.dir);
    return list;
  }, [all, q, svc, status, sort]);

  const update = async (id: string, patch: Partial<Row>) => {
    const { error } = await supabase.from("survey_responses").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["responses"] });
    setDetail((d) => (d && d.id === id ? { ...d, ...patch } : d));
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this response permanently?")) return;
    const { error } = await supabase.from("survey_responses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setDetail(null);
    qc.invalidateQueries({ queryKey: ["responses"] });
    qc.invalidateQueries({ queryKey: ["public-stats"] });
  };

  const download = (name: string, content: string, type: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
  };
  const exportCsv = () => {
    const cols = ["id", "created_at", "customer_name", "company_name", "contact_info", "service_date", "service_types", "service_other",
      ...RATING_IDS, ...[...S3.questions, ...S4.questions].map(([id]) => id), "follow_up", "contact_methods", "contact_other", "contacted", "resolved"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = filtered.map((r) => {
      const rt = ratingsOf(r), oa = openOf(r);
      const rec: Record<string, unknown> = { ...r, service_types: r.service_types.join("; "), contact_methods: r.contact_methods.join("; ") };
      return cols.map((c) => esc(c in rt ? rt[c] : c in oa ? oa[c] : rec[c])).join(",");
    });
    download("of-sam-019-responses.csv", "\uFEFF" + [cols.join(","), ...lines].join("\n"), "text/csv;charset=utf-8");
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };
  const actions = (
    <>
      <button className="chrome-btn" onClick={exportCsv}>⬇️ Export CSV</button>
      <button className="chrome-btn" onClick={() => download("of-sam-019-responses.json", JSON.stringify(filtered, null, 2), "application/json")}>⬇️ Export JSON</button>
      <button className="chrome-btn" onClick={signOut}>🚪 Sign out</button>
    </>
  );

  if (role.isLoading) return <div className="min-h-screen"><AppHeader active="admin" /><p className="p-10 text-center text-muted-foreground">Loading…</p></div>;
  if (!role.data) return (
    <div className="min-h-screen"><AppHeader active="admin" actions={<button className="chrome-btn" onClick={signOut}>🚪 Sign out</button>} />
      <div className="mx-auto max-w-md p-10 card-surface mt-10 text-center"><h1 className="font-bold text-lg">No admin access</h1><p className="text-sm text-muted-foreground mt-2">This account is not an administrator.</p></div>
    </div>
  );

  const followQueue = all.filter((r) => r.follow_up);

  return (
    <div className="min-h-screen">
      <AppHeader active="admin" actions={actions} subtitle="Survey Management & Enterprise Records" />
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label="Total Responses" value={kpi.total} />
          <Kpi label="Average Overall Satisfaction (2.10)" value={fmt(kpi.overall)} status={scoreStatus(kpi.overall)} />
          <Kpi label="Follow-ups Requested" value={kpi.follow} />
          <Kpi label="Open Issues" value={kpi.open} status={kpi.open ? "poor" : "good"} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Average score per rating question">
            <BarChart data={perQuestion}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="id" fontSize={11} /><YAxis domain={[0, 5]} fontSize={11} /><Tooltip />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]}>{perQuestion.map((p) => <Cell key={p.id} fill={STATUS_FILL[p.status]} />)}</Bar></BarChart>
          </ChartCard>
          <ChartCard title="Rating distribution">
            <BarChart data={distribution}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="n" /><YAxis allowDecimals={false} fontSize={11} /><Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>{distribution.map((d) => <Cell key={d.n} fill={`var(--r${d.n})`} />)}</Bar></BarChart>
          </ChartCard>
          <ChartCard title="Responses over time">
            <LineChart data={overTime}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip />
              <Line dataKey="count" stroke="var(--primary)" strokeWidth={3} dot /></LineChart>
          </ChartCard>
          <ChartCard title="Breakdown by service type (1.5)">
            <PieChart><Tooltip /><Pie data={bySvc} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} label={(e) => e.name}>
              {bySvc.map((_, i) => <Cell key={i} fill={["var(--primary)", "var(--navy)", "var(--success)", "var(--warning)"][i]} />)}</Pie></PieChart>
          </ChartCard>
        </div>

        <div className="flex gap-2">
          <TabBtn on={tab === "records"} onClick={() => setTab("records")}>📁 Records ({all.length})</TabBtn>
          <TabBtn on={tab === "followup"} onClick={() => setTab("followup")}>📞 Follow-up Queue ({followQueue.filter((r) => !r.contacted).length})</TabBtn>
        </div>

        {tab === "records" ? (
          <section className="card-surface overflow-hidden">
            <div className="flex flex-wrap gap-2 p-3 border-b">
              <input className="inp flex-1 min-w-48" placeholder="Search name, company, contact…" value={q} onChange={(e) => setQ(e.target.value)} />
              <select className="inp w-auto font-ethiopic" value={svc} onChange={(e) => setSvc(e.target.value)}>
                <option value="all">All services</option>{[...S1.services, S1.other].map((s) => <option key={s}>{s}</option>)}
              </select>
              <select className="inp w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All scores</option><option value="good">≥ 4.0</option><option value="fair">3.0 – 3.9</option><option value="poor">&lt; 3.0</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <SortTh label="Submitted" k="date" sort={sort} setSort={setSort} />
                    <th className="p-3">Customer</th><th className="p-3">Service</th>
                    <SortTh label="Avg" k="avg" sort={sort} setSort={setSort} />
                    <SortTh label="2.10" k="overall" sort={sort} setSort={setSort} />
                    <th className="p-3">Follow-up</th><th className="p-3">Issue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((r) => {
                    const avg = responseAverage(ratingsOf(r)); const ov = ratingsOf(r)["2.10"];
                    const issue = isOpenIssue({ ratings: ratingsOf(r), open_answers: openOf(r), resolved: r.resolved });
                    return (
                      <tr key={r.id} className="hover:bg-secondary/60 cursor-pointer" onClick={() => setDetail(r)}>
                        <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-3 font-ethiopic">{r.customer_name || "—"}<div className="text-xs text-muted-foreground">{r.company_name}</div></td>
                        <td className="p-3 font-ethiopic text-xs">{r.service_types.join(", ") || "—"}</td>
                        <td className="p-3"><span className={`rounded-md px-2 py-0.5 font-bold ${STATUS_BG[scoreStatus(avg)]}`}>{fmt(avg)}</span></td>
                        <td className={`p-3 font-bold ${STATUS_TEXT[scoreStatus(ov)]}`}>{ov ?? "–"}</td>
                        <td className="p-3">{r.follow_up ? (r.contacted ? "✅ Contacted" : "⏳ Pending") : "—"}</td>
                        <td className="p-3">{issue ? <span className="text-danger font-semibold">● Open</span> : r.resolved ? "Resolved" : "—"}</td>
                      </tr>
                    );
                  })}
                  {!filtered.length && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No responses yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="grid gap-3 sm:grid-cols-2">
            {followQueue.map((r) => (
              <div key={r.id} className="card-surface p-4 space-y-2 font-ethiopic">
                <div className="flex justify-between gap-2">
                  <div><b>{r.customer_name || "—"}</b><div className="text-xs text-muted-foreground">{r.company_name}</div></div>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-sm">{S1.q1_3} <b>{r.contact_info || "—"}</b></div>
                <div className="text-sm">{S5.q5_2} <b>{[...r.contact_methods.filter((m) => m !== S5.other), r.contact_other].filter(Boolean).join(", ") || "—"}</b></div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => update(r.id, { contacted: !r.contacted })}
                    className={`flex-1 min-h-11 rounded-lg font-semibold font-sans ${r.contacted ? "bg-success-soft text-success" : "bg-primary text-primary-foreground"}`}>
                    {r.contacted ? "✅ Contacted" : "Mark as Contacted"}
                  </button>
                  <button onClick={() => setDetail(r)} className="min-h-11 px-3 rounded-lg border font-sans">View</button>
                </div>
              </div>
            ))}
            {!followQueue.length && <p className="text-muted-foreground">No follow-up requests.</p>}
          </section>
        )}
      </main>

      {detail && (
        <div className="fixed inset-0 z-50 bg-navy/60 grid place-items-center p-3" onClick={() => setDetail(null)}>
          <div className="card-surface w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4 font-ethiopic" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-3">
              <div><h3 className="font-bold text-lg">{detail.customer_name || "—"}</h3><p className="text-xs text-muted-foreground">{new Date(detail.created_at).toLocaleString()}</p></div>
              <button onClick={() => setDetail(null)} className="text-2xl leading-none">×</button>
            </div>
            <div className="flex flex-wrap gap-2 font-sans">
              <button onClick={() => update(detail.id, { resolved: !detail.resolved })} className="rounded-lg border px-3 py-2 text-sm font-semibold">{detail.resolved ? "↩︎ Reopen issue" : "✔ Mark issue resolved"}</button>
              {detail.follow_up && <button onClick={() => update(detail.id, { contacted: !detail.contacted })} className="rounded-lg border px-3 py-2 text-sm font-semibold">{detail.contacted ? "✅ Contacted" : "Mark as Contacted"}</button>}
              <button onClick={() => remove(detail.id)} className="rounded-lg bg-danger-soft text-danger px-3 py-2 text-sm font-semibold">🗑 Delete</button>
            </div>
            <Dl rows={[[S1.q1_1, detail.customer_name], [S1.q1_2, detail.company_name], [S1.q1_3, detail.contact_info], [S1.q1_4, detail.service_date],
              [S1.q1_5, [...detail.service_types, detail.service_other].filter(Boolean).join(", ")]]} />
            <div className="space-y-1">
              {S2.questions.map(([id, qq]) => { const v = ratingsOf(detail)[id]; return (
                <div key={id} className="flex justify-between gap-3 text-sm border-b py-1.5"><span>{id} {qq}</span><b className={STATUS_TEXT[scoreStatus(v)]}>{v ?? "–"}</b></div>
              ); })}
            </div>
            <Dl rows={[...S3.questions, ...S4.questions].map(([id, qq]) => [`${id} ${qq}`, openOf(detail)[id]])} />
            <Dl rows={[[S5.q5_1, detail.follow_up == null ? "" : detail.follow_up ? S5.yes : S5.no],
              [S5.q5_2, [...detail.contact_methods.filter((m) => m !== S5.other), detail.contact_other].filter(Boolean).join(", ")]]} />
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, status }: { label: string; value: ReactNode; status?: Status }) {
  return (
    <div className="card-surface p-4">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className={`mt-2 text-3xl font-extrabold ${status ? STATUS_TEXT[status] : ""}`}>{value}</div>
    </div>
  );
}
function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="card-surface p-4">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><span className="h-4 w-1 rounded bg-primary" />{title}</h3>
      <div className="h-60 font-ethiopic"><ResponsiveContainer>{children}</ResponsiveContainer></div>
    </div>
  );
}
function TabBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick} className={`min-h-11 rounded-lg px-4 font-semibold text-sm ${on ? "bg-navy text-navy-foreground" : "bg-card border"}`}>{children}</button>;
}
function SortTh({ label, k, sort, setSort }: { label: string; k: "date" | "avg" | "overall"; sort: { k: string; dir: 1 | -1 }; setSort: (s: { k: "date" | "avg" | "overall"; dir: 1 | -1 }) => void }) {
  return (
    <th className="p-3 cursor-pointer select-none whitespace-nowrap" onClick={() => setSort({ k, dir: sort.k === k ? (sort.dir === 1 ? -1 : 1) : -1 })}>
      {label} {sort.k === k ? (sort.dir === 1 ? "▲" : "▼") : ""}
    </th>
  );
}
function Dl({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl className="space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold whitespace-pre-wrap">{v || "—"}</dd></div>
      ))}
    </dl>
  );
}
