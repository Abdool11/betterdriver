"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, Clock, Info } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const BULLETINS_COPY = {
  en: { title: "Bulletins", sub: "Safety and operational updates from your company", loading: "Loading bulletins…", empty: "No active bulletins for your company." },
  zu: { title: "Izaziso", sub: "Izibuyekezo zokuphepha nezokusebenza evela enkampanini yakho", loading: "Iyalayisha izaziso…", empty: "Azikho izaziso ezisebenzayo zenkampani yakho." },
};

type BulletinSummary = {
  id: string;
  title: string;
  content: string;
  urgency: "urgent" | "important" | "information" | string | null;
  created_at: string | null;
  read: boolean;
};

type BulletinsResponse = { bulletins: BulletinSummary[] };

function formatDate(iso: string | null) {
  if (!iso) return "Date not available";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Date not available" : date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function urgencyPresentation(urgency: BulletinSummary["urgency"]) {
  if (urgency === "urgent") return { label: "Urgent", color: "#EF4444", background: "rgba(239,68,68,0.1)", icon: <AlertTriangle size={16} /> };
  if (urgency === "important") return { label: "Important", color: "#F59E0B", background: "rgba(245,158,11,0.1)", icon: <Bell size={16} /> };
  return { label: "Information", color: "#60A5FA", background: "rgba(59,130,246,0.1)", icon: <Info size={16} /> };
}

export default function BulletinsListPage() {
  const lang = useLanguage();
  const copy = BULLETINS_COPY[lang];
  const [bulletins, setBulletins] = useState<BulletinSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBulletins() {
      try {
        const response = await fetch("/api/portal/bulletins", { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/start");
          return;
        }
        if (!response.ok) throw new Error("Could not load your company bulletins.");
        const data = (await response.json()) as BulletinsResponse;
        if (active) setBulletins(data.bulletins);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your company bulletins.");
      }
    }

    void loadBulletins();
    return () => { active = false; };
  }, []);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
        <div style={{ width: 40, height: 40, background: "rgba(245,158,11,0.1)", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}><Bell size={20} color="#F59E0B" /></div>
        <div><h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#F9FAFB", margin: 0 }}>{copy.title}</h1><p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>{copy.sub}</p></div>
      </div>

      {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : !bulletins ? <div style={{ textAlign: "center", padding: "3rem 0", color: "#6B7280" }}>{copy.loading}</div> : bulletins.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: "#0d1117", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.07)" }}><Bell size={32} color="#374151" style={{ marginBottom: "0.75rem" }} /><p style={{ color: "#6B7280", margin: 0 }}>{copy.empty}</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {bulletins.map((bulletin) => {
            const presentation = urgencyPresentation(bulletin.urgency);
            return (
              <Link key={bulletin.id} href={`/portal/bulletins/${bulletin.id}`} style={{ display: "flex", alignItems: "center", gap: "1rem", background: bulletin.read ? "#0d1117" : "rgba(245,158,11,0.04)", border: bulletin.read ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(245,158,11,0.2)", borderRadius: "1rem", padding: "1rem 1.25rem", textDecoration: "none" }}>
                <div style={{ width: 36, height: 36, background: presentation.background, borderRadius: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: presentation.color }}>{presentation.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: bulletin.read ? 600 : 700, fontSize: "0.875rem", color: "#F9FAFB", margin: "0 0 0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bulletin.title}</p>
                  <p style={{ color: "#9CA3AF", fontSize: "0.75rem", lineHeight: 1.4, margin: "0 0 0.45rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bulletin.content}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ fontSize: "0.75rem", color: presentation.color, fontWeight: bulletin.urgency === "urgent" ? 700 : 500 }}>{presentation.label}</span><span style={{ color: "#374151", fontSize: "0.75rem" }}>·</span><span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#6B7280" }}><Clock size={11} />{formatDate(bulletin.created_at)}</span></div>
                </div>
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>{bulletin.read ? <CheckCircle2 size={16} color="#22C55E" /> : <div style={{ width: 8, height: 8, background: "#F59E0B", borderRadius: "50%" }} />}<ChevronRight size={14} color="#6B7280" /></div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
