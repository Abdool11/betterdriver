"use client";
import { useState } from "react";
import { CheckCircle, Loader2, ToggleLeft, ToggleRight } from "lucide-react";

interface StatField {
  key: string;
  label: string;
  description: string;
  liveKey: string;
  liveDescription: string;
}

const STAT_FIELDS: StatField[] = [
  {
    key: "stat_workshops",
    label: "Strategic Workshops",
    description: "Number shown in the bragging strip on TAG and GFA homepages.",
    liveKey: "stat_workshops_use_live",
    liveDescription: "When enabled, pulls the live count from the workshops database table instead of the static number.",
  },
  {
    key: "stat_training_seats",
    label: "Training Seats Booked",
    description: "Total training seats booked — shown across TAG, GFA, and BD.",
    liveKey: "stat_training_seats_use_live",
    liveDescription: "When enabled, pulls the live count from the GFA bookings database instead of the static number.",
  },
  {
    key: "stat_certifications",
    label: "Certifications Completed",
    description: "Total certifications issued — shown across TAG, GFA, and BD.",
    liveKey: "stat_certifications_use_live",
    liveDescription: "When enabled, pulls the live count from the GFA certifications database instead of the static number.",
  },
  {
    key: "stat_companies",
    label: "Companies Enrolled",
    description: "Number of companies enrolled — shown on GFA homepage.",
    liveKey: "stat_companies_use_live",
    liveDescription: "When enabled, pulls the live count from the GFA companies database instead of the static number.",
  },
];

interface StatsAdminClientProps {
  initialValues: Record<string, string>;
}

export default function StatsAdminClient({ initialValues }: StatsAdminClientProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: string) => {
    setValues(prev => ({ ...prev, [key]: prev[key] === "true" ? "false" : "true" }));
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "#f9fafb", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Impact Stats</h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.9375rem" }}>
          Set the numbers displayed in the bragging strip across TAG, GFA, and BD. Each stat can show a static number
          or pull live data from the database.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {STAT_FIELDS.map((field) => {
          const useLive = values[field.liveKey] === "true";
          return (
            <div
              key={field.key}
              style={{
                background: "#0d1520",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "0.875rem",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#f9fafb", fontWeight: 600, fontSize: "0.9375rem", margin: "0 0 0.25rem" }}>{field.label}</p>
                  <p style={{ color: "#6b7280", fontSize: "0.8125rem", margin: 0 }}>{field.description}</p>
                </div>
                <button
                  onClick={() => toggle(field.liveKey)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: useLive ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${useLive ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "2rem",
                    padding: "0.375rem 0.875rem",
                    cursor: "pointer",
                    color: useLive ? "#22c55e" : "#9ca3af",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {useLive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {useLive ? "Live DB" : "Static"}
                </button>
              </div>

              {!useLive && (
                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.375rem" }}>
                    Static value
                  </label>
                  <input
                    type="number"
                    value={values[field.key] ?? ""}
                    onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    style={{
                      background: "#111827",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.5rem",
                      padding: "0.5rem 0.875rem",
                      color: "#f9fafb",
                      fontSize: "1rem",
                      width: "160px",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              {useLive && (
                <p style={{ marginTop: "0.875rem", color: "#4ade80", fontSize: "0.8125rem" }}>
                  ✓ {field.liveDescription}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p style={{ color: "#f87171", fontSize: "0.875rem", marginTop: "1rem" }}>{error}</p>
      )}

      <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: "#22c55e",
            color: "#000",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.625rem 1.5rem",
            fontWeight: 700,
            fontSize: "0.9375rem",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span style={{ color: "#22c55e", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <CheckCircle size={16} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
