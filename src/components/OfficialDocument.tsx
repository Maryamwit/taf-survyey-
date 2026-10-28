import type { ReactNode } from "react";
import { DOC, S1, S2, S3, S4, S5, type SurveyData } from "@/lib/survey";

function Box({ checked }: { checked: boolean }) {
  return (
    <span className="inline-grid h-[13px] w-[13px] place-items-center border border-ink align-middle text-[10px] leading-none font-bold mx-0.5">
      {checked ? "✓" : ""}
    </span>
  );
}

function Line({ value, min = "60%" }: { value?: string; min?: string }) {
  return (
    <span className="inline-block border-b border-ink align-bottom px-1 font-semibold" style={{ minWidth: min }}>
      {value || "\u00a0"}
    </span>
  );
}

function Lines({ value }: { value?: string | undefined }) {
  const text = (value ?? "").trim();
  return (
    <div className="ml-6 mt-1 space-y-0">
      <div
        className="min-h-[96px] whitespace-pre-wrap font-semibold leading-[24px]"
        style={{
          backgroundImage: "linear-gradient(to bottom, transparent 23px, currentColor 23px, currentColor 24px)",
          backgroundSize: "100% 24px",
        }}
      >
        {text || "\u00a0"}
      </div>
    </div>
  );
}

function Header({ page }: { page: number }) {
  const cell = "border border-ink p-1.5 align-top";
  const small = "text-[8pt] leading-tight";
  return (
    <table className="w-full border-collapse border-2 border-ink" style={{ tableLayout: "fixed" }}>
      <colgroup>
        <col style={{ width: "12%" }} />
        <col style={{ width: "62%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "16%" }} />
      </colgroup>
      <tbody>
        <tr>
          <td className={cell + " text-center align-middle"}>
            <img src="/taf-logo.png" alt="TAF logo" className="mx-auto h-[18mm] w-auto" />
          </td>
          <td className={cell}>
            <div className={small}>{DOC.companyLabelAm}<br />{DOC.companyLabelEn}</div>
            <div className="text-center font-doc">
              <div className="font-bold text-[14pt]">{DOC.companyAm}</div>
              <div className="text-[13pt]">{DOC.companyEn}</div>
            </div>
          </td>
          <td className={cell} colSpan={2}>
            <div className={small}>{DOC.docNoLabelAm}<br />{DOC.docNoLabelEn}</div>
            <div className="text-center font-doc font-bold text-[14pt] mt-2">{DOC.docNo}</div>
          </td>
        </tr>
        <tr>
          <td className={cell} colSpan={2}>
            <div className={small}>{DOC.titleLabelAm}<br />{DOC.titleLabelEn}</div>
            <div className="text-center font-doc">
              <div className="font-bold text-[13pt]">{DOC.titleAm}</div>
              <div className="text-[11.5pt]">{DOC.titleEn}</div>
            </div>
          </td>
          <td className={cell}>
            <div className={small}>{DOC.issueLabelAm}<br />{DOC.issueLabelEn}</div>
            <div className="text-center font-doc font-bold text-[13pt] mt-2">{DOC.issueNo}</div>
          </td>
          <td className={cell}>
            <div className={small}>{DOC.pageLabelAm}<br />{DOC.pageLabelEn}</div>
            <div className="text-center font-doc font-bold text-[13pt] mt-2 whitespace-nowrap">Page {page} of 3</div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Page({ page, children }: { page: number; children: ReactNode }) {
  return (
    <div className="a4-page">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center select-none"
      >
        <span
          className="font-doc whitespace-nowrap text-[34pt] tracking-wide"
          style={{ transform: "rotate(-55deg)", color: "oklch(0.15 0 0 / 0.12)" }}
        >
          {DOC.watermark}
        </span>
      </div>
      <Header page={page} />
      <div className="relative flex-1 px-[8mm] pt-5 space-y-3">{children}</div>
      <footer className="relative mt-4 mx-[6mm] border-t-[4px] border-ink pt-1 text-center font-doc leading-tight">
        <div className="text-[9pt] font-bold">{DOC.footerAm}</div>
        <div className="text-[9pt] font-bold">{DOC.footerEn}</div>
      </footer>
    </div>
  );
}

const H = ({ children }: { children: ReactNode }) => (
  <h2 className="font-extrabold text-[14pt] mt-2">{children}</h2>
);

export function OfficialDocument({ data }: { data: SurveyData }) {
  const a = data.open_answers ?? {};
  return (
    <div className="print-area flex flex-col items-center gap-6 py-6 bg-muted overflow-x-auto">
      <Page page={1}>
        <H>{S1.title}</H>
        <div className="ml-8 space-y-2.5">
          <div>{S1.q1_1}<Line value={data.customer_name} /></div>
          <div>{S1.q1_2} <Line value={data.company_name} /></div>
          <div>{S1.q1_3}<Line value={data.contact_info} /></div>
          <div>{S1.q1_4} <Line value={data.service_date} /></div>
          <div>{S1.q1_5}</div>
          <div className="ml-24 space-y-2">
            {S1.services.map((s) => (
              <div key={s}><Box checked={data.service_types.includes(s)} /> {s}</div>
            ))}
            <div>
              <Box checked={data.service_types.includes(S1.other)} /> {S1.other} <Line value={data.service_other} min="50%" />
            </div>
          </div>
        </div>
        <H>{S2.title}</H>
        <p className="leading-relaxed">{S2.intro}</p>
        <div className="space-y-[7px]">
          {S2.questions.map(([id, q]) => (
            <div key={id} className="flex items-baseline gap-2">
              <span className="flex-1">{id} {q}</span>
              <span className="whitespace-nowrap">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="mr-1">{n} <Box checked={data.ratings[id] === n} /></span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </Page>

      <Page page={2}>
        <H>{S3.title}</H>
        {S3.questions.map(([id, q]) => (
          <div key={id} className="pt-1">
            <div>{id} {q}</div>
            <Lines value={a[id]} />
          </div>
        ))}
      </Page>

      <Page page={3}>
        <H>{S4.title}</H>
        {S4.questions.map(([id, q]) => (
          <div key={id} className="pt-1">
            <div>{id} {q}</div>
            <Lines value={a[id]} />
          </div>
        ))}
        <H>{S5.title}</H>
        <div className="space-y-2.5">
          <div>
            {S5.q5_1} {S5.yes} <Box checked={data.follow_up === true} />
            <span className="ml-10">{S5.no} <Box checked={data.follow_up === false} /></span>
          </div>
          <div>
            {S5.q5_2}
            {S5.methods.map((m) => (
              <span key={m} className="ml-6">{m} <Box checked={data.follow_up === true && data.contact_methods.includes(m)} /></span>
            ))}
            <span className="ml-6">{S5.other} <Line value={data.follow_up ? data.contact_other : ""} min="30%" /></span>
          </div>
        </div>
      </Page>
    </div>
  );
}
