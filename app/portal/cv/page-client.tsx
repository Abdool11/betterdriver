"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2, ShieldCheck, Truck, User } from "lucide-react";

type DriverProfile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  id_number: string | null;
  licence_number: string | null;
  licence_class: string | null;
  licence_expiry: string | null;
  prpd_number: string | null;
  years_experience: number | null;
  vehicle_types: string[] | null;
  profile_complete: boolean | null;
};

type ProfileResponse = { driver: DriverProfile };

function valueOrDash(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Not recorded" : String(value);
}

function displayDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CVPage() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const response = await fetch("/api/portal/profile", { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/start");
          return;
        }
        if (!response.ok) throw new Error("Could not load your driver profile.");
        const data = (await response.json()) as ProfileResponse;
        if (active) setProfile(data.driver);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your driver profile.");
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, []);

  async function downloadProfileSummary() {
    setDownloading(true);
    try {
      const response = await fetch("/api/portal/cv", { method: "POST" });
      if (!response.ok) throw new Error("Could not prepare your profile summary.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "BetterDriver_Profile_Summary.html";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Could not prepare your profile summary.");
    } finally {
      setDownloading(false);
    }
  }

  if (error) return <div className="page-content"><h1 className="portal-page-title">My driver profile</h1><p style={{ color: "#fca5a5" }}>{error}</p></div>;
  if (!profile) return <div className="page-content"><Loader2 size={20} style={{ color: "#F59E0B", animation: "spin 1s linear infinite" }} /><span style={{ color: "#9CA3AF", marginLeft: "0.625rem" }}>Loading your driver profile…</span></div>;

  const rows = [
    ["Full name", valueOrDash(profile.full_name)],
    ["Mobile", valueOrDash(profile.phone)],
    ["Email", valueOrDash(profile.email)],
    ["Licence number", valueOrDash(profile.licence_number)],
    ["Licence class", valueOrDash(profile.licence_class)],
    ["Licence expiry", displayDate(profile.licence_expiry)],
    ["PrDP number", valueOrDash(profile.prpd_number)],
    ["Years driving", valueOrDash(profile.years_experience)],
    ["Vehicle types", profile.vehicle_types?.length ? profile.vehicle_types.join(", ") : "Not recorded"],
  ];

  return (
    <div className="page-content" style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div><h1 className="portal-page-title">My driver profile</h1><p style={{ color: "#9CA3AF", margin: 0 }}>A summary of the information recorded for this signed-in driver profile.</p></div>
        <button type="button" className="btn-primary" onClick={() => void downloadProfileSummary()} disabled={downloading} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>{downloading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={15} />}{downloading ? "Preparing…" : "Download profile summary"}</button>
      </div>

      {!profile.profile_complete && <section style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "1rem", padding: "1rem", color: "#FCD34D", fontSize: "0.875rem" }}>Some profile details are not recorded yet. Contact your company administrator or Green Freight Academy support if information needs to be corrected.</section>}

      <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}><User size={18} style={{ color: "#F59E0B" }} /><h2 style={{ color: "#F9FAFB", fontSize: "1rem", margin: 0 }}>Driver details</h2></div>
        <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", margin: 0 }}>{rows.map(([label, value]) => <div key={label}><dt style={{ color: "#6B7280", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>{label}</dt><dd style={{ color: "#F9FAFB", fontSize: "0.9rem", margin: 0, overflowWrap: "anywhere" }}>{value}</dd></div>)}</dl>
      </section>

      <section style={{ background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: "1rem", padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <ShieldCheck size={20} style={{ color: "#14b8a6", flexShrink: 0, marginTop: "0.1rem" }} />
        <div><h2 style={{ color: "#F9FAFB", fontSize: "0.95rem", margin: "0 0 0.25rem" }}>Certificates are managed by Green Freight Academy</h2><p style={{ color: "#D1D5DB", fontSize: "0.8125rem", lineHeight: 1.5, margin: 0 }}>Your official qualification record, verification and certificate PDF will be provided through the GFA-authoritative certificate service once its secure handoff is available.</p></div>
      </section>
    </div>
  );
}
