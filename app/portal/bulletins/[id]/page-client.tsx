"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, ShieldCheck } from "lucide-react";

type Bulletin = {
  id: string;
  title: string;
  content: string;
  urgency: "urgent" | "important" | "information" | string | null;
  created_at: string | null;
};

type BulletinResponse = { bulletin: Bulletin };

function formatDate(value: string | null) {
  if (!value) return "Date not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date not available" : date.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
}

export default function BulletinDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [error, setError] = useState("");
  const [readRecorded, setReadRecorded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBulletin() {
      try {
        const response = await fetch(`/api/portal/bulletins/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/start");
          return;
        }
        if (response.status === 403 || response.status === 404) throw new Error("This bulletin is not available for your driver profile.");
        if (!response.ok) throw new Error("Could not load this bulletin.");
        const data = (await response.json()) as BulletinResponse;
        if (!active) return;
        setBulletin(data.bulletin);

        const readResponse = await fetch(`/api/portal/bulletins/${encodeURIComponent(id)}/read`, { method: "POST" });
        if (active && readResponse.ok) setReadRecorded(true);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load this bulletin.");
      }
    }

    if (id) void loadBulletin();
    return () => { active = false; };
  }, [id]);

  if (error) return <div className="page-content"><Link href="/portal/bulletins" className="portal-back-link">← Back to bulletins</Link><h1 className="portal-page-title">Bulletin unavailable</h1><p style={{ color: "#fca5a5" }}>{error}</p></div>;
  if (!bulletin) return <div className="page-content"><Link href="/portal/bulletins" className="portal-back-link">← Back to bulletins</Link><h1 className="portal-page-title">Loading bulletin…</h1></div>;

  const urgent = bulletin.urgency === "urgent";

  return (
    <article className="page-content">
      <Link href="/portal/bulletins" className="portal-back-link"><ArrowLeft size={15} /> Back to bulletins</Link>
      <div style={{ marginTop: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "inline-flex", gap: "0.375rem", alignItems: "center", padding: "0.3rem 0.625rem", borderRadius: "9999px", background: urgent ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)", color: urgent ? "#fca5a5" : "#60a5fa", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.75rem" }}>{urgent ? <AlertTriangle size={14} /> : <Info size={14} />}{urgent ? "Urgent safety update" : "Company update"}</div>
        <h1 className="portal-page-title">{bulletin.title}</h1>
        <p style={{ color: "#6B7280", margin: 0 }}>{formatDate(bulletin.created_at)}</p>
      </div>

      <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem", color: "#E5E7EB", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{bulletin.content}</section>

      <section style={{ marginTop: "1rem", background: readRecorded ? "rgba(16,185,129,0.08)" : "#1C2333", border: `1px solid ${readRecorded ? "rgba(16,185,129,0.25)" : "#2d3a4f"}`, borderRadius: "1rem", padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {readRecorded ? <CheckCircle2 size={20} style={{ color: "#10B981", flexShrink: 0 }} /> : <ShieldCheck size={20} style={{ color: "#60a5fa", flexShrink: 0 }} />}
        <p style={{ color: "#D1D5DB", fontSize: "0.875rem", margin: 0 }}>{readRecorded ? "Read acknowledgement recorded for your driver profile." : "This bulletin belongs to your company update feed."}</p>
      </section>
    </article>
  );
}
