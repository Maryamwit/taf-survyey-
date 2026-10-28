import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AppHeader } from "@/components/AppHeader";
import { DOC } from "@/lib/survey";

export const Route = createFileRoute("/qr")({
  head: () => ({
    meta: [
      { title: "Station QR Poster – TAF Customer Survey" },
      { name: "description", content: "Printable QR code poster linking to the TAF customer satisfaction survey." },
      { property: "og:title", content: "Station QR Poster – TAF Customer Survey" },
      { property: "og:description", content: "Scan to take the TAF ENERGIES PLC customer survey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QrPage,
});

function QrPage() {
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.origin + "/"), []);
  return (
    <div className="min-h-screen bg-muted">
      <AppHeader active="qr" actions={<button className="chrome-btn" onClick={() => window.print()}>🖨️ Print PDF</button>} />
      <div className="print-area flex justify-center py-6 overflow-x-auto">
        <div className="a4-page items-center justify-center text-center gap-8">
          <img src="/taf-logo.png" alt="TAF" className="h-28" />
          <div className="font-doc">
            <div className="text-[24pt] font-bold">{DOC.companyAm}</div>
            <div className="text-[18pt]">{DOC.companyEn}</div>
          </div>
          <div className="text-[22pt] font-bold">{DOC.titleAm}</div>
          <div className="text-[13pt]">{DOC.titleEn}</div>
          <div className="rounded-3xl border-8 border-primary p-6 bg-paper">
            {url && <QRCodeSVG value={url} size={300} level="M" />}
          </div>
          <div className="text-[11pt] break-all">{url}</div>
          <div className="text-[10pt]">{DOC.docNo}</div>
        </div>
      </div>
    </div>
  );
}
