"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, CalendarDays, Mail, Phone, ShieldCheck, Truck, User } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

type DriverProfile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  id_number: string | null;
  date_of_birth: string | null;
  licence_number: string | null;
  licence_class: string | null;
  licence_expiry: string | null;
  prpd_number: string | null;
  years_experience: number | null;
  vehicle_types: string[] | null;
  profile_complete: boolean | null;
};

type ProfileResponse = { driver: DriverProfile };

function displayDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function DetailsCard({
  icon,
  title,
  entries,
}: {
  icon: React.ReactNode;
  title: string;
  entries: Array<{ label: string; value: string }>;
}) {
  return (
    <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
        <span style={{ color: "#F59E0B" }}>{icon}</span>
        <h2 style={{ color: "#F9FAFB", fontSize: "1rem", margin: 0 }}>{title}</h2>
      </div>
      <dl style={{ margin: 0, display: "grid", gap: "0.875rem" }}>
        {entries.map((entry) => (
          <div key={entry.label} style={{ display: "grid", gap: "0.2rem" }}>
            <dt style={{ color: "#6B7280", fontSize: "0.75rem", fontWeight: 600 }}>{entry.label}</dt>
            <dd style={{ color: "#F9FAFB", fontSize: "0.9rem", margin: 0, overflowWrap: "anywhere" }}>{entry.value || "Not recorded"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ProfilePage() {
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/portal/profile", { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/start");
          return;
        }
        if (!response.ok) throw new Error("Could not load your profile.");
        const data = (await response.json()) as ProfileResponse;
        if (active) setDriver(data.driver);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your profile.");
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const completion = useMemo(() => {
    if (!driver) return 0;
    const fields = [driver.id_number, driver.licence_number, driver.licence_class, driver.licence_expiry, driver.years_experience, driver.vehicle_types?.length];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [driver]);

  if (error) return <div className="page-content"><TranslatedPageHeader pageKey="profile" /><p style={{ color: "#fca5a5" }}>{error}</p></div>;
  if (!driver) return <div className="page-content"><TranslatedPageHeader pageKey="profile" /><p style={{ color: "#9CA3AF" }}>Loading your profile…</p></div>;

  return (
    <div className="page-content" style={{ display: "grid", gap: "1rem" }}>
      <TranslatedPageHeader pageKey="profile" />

      <section style={{ background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: "1rem", padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <ShieldCheck size={20} style={{ color: "#14b8a6", flexShrink: 0, marginTop: "0.1rem" }} />
        <p style={{ color: "#D1D5DB", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>
          This is the profile for your signed-in driver account. Your professional identity and official certification record remain managed by Green Freight Academy.
        </p>
      </section>

      <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <p style={{ color: "#6B7280", fontSize: "0.75rem", fontWeight: 600, margin: "0 0 0.375rem" }}>Profile information recorded</p>
            <p style={{ color: "#F9FAFB", fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{completion}%</p>
          </div>
          <div className="progress-bar" style={{ width: "min(100%, 260px)" }}><div className="progress-fill" style={{ width: `${completion}%` }} /></div>
        </div>
      </section>

      <DetailsCard icon={<User size={18} />} title="Personal details" entries={[
        { label: "Full name", value: driver.full_name || "Not recorded" },
        { label: "ID number", value: driver.id_number || "Not recorded" },
        { label: "Email", value: driver.email || "Not recorded" },
        { label: "Mobile", value: driver.phone || "Not recorded" },
        { label: "Date of birth", value: displayDate(driver.date_of_birth) },
      ]} />

      <DetailsCard icon={<Truck size={18} />} title="Licence and PrDP" entries={[
        { label: "Licence number", value: driver.licence_number || "Not recorded" },
        { label: "Licence class", value: driver.licence_class || "Not recorded" },
        { label: "Licence expiry", value: displayDate(driver.licence_expiry) },
        { label: "PrDP number", value: driver.prpd_number || "Not recorded" },
      ]} />

      <DetailsCard icon={<Briefcase size={18} />} title="Driving experience" entries={[
        { label: "Years driving", value: driver.years_experience == null ? "Not recorded" : String(driver.years_experience) },
        { label: "Vehicle types", value: driver.vehicle_types?.length ? driver.vehicle_types.join(", ") : "Not recorded" },
      ]} />

      <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1rem", color: "#9CA3AF", fontSize: "0.8125rem", lineHeight: 1.5 }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.35rem", color: "#F9FAFB", fontWeight: 700 }}><Mail size={15} /> Need a correction?</div>
        Contact your company administrator or Green Freight Academy support to correct professional identity, licence or qualification details.
      </section>
    </div>
  );
}
