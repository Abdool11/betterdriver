"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface Course {
  id: string;
  slug: string;
  name: string;
  audience: string;
  price_individual: number;
  price_corporate: number;
  active: boolean;
}

interface PricingClientProps {
  courses: Course[];
  vatRate: string;
  vatEnabled: boolean;
}

export default function PricingClient({ courses: initialCourses, vatRate: initialVatRate, vatEnabled: initialVatEnabled }: PricingClientProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [vatRate, setVatRate] = useState(initialVatRate);
  const [vatEnabled, setVatEnabled] = useState(initialVatEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updatePrice = (id: string, field: "price_individual" | "price_corporate", value: string) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, [field]: parseFloat(value) || 0 } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses, vatRate, vatEnabled }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const audienceLabel = (a: string) =>
    a === "driver" ? "Driver" : a === "management" ? "Management" : "Freight Buyer";

  const audienceColor = (a: string) =>
    a === "driver" ? "#f59e0b" : a === "management" ? "#3b82f6" : "#10b981";

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "#f9fafb", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Programme Pricing</h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.9375rem" }}>
          Update individual and corporate pricing for all programmes. Changes take effect immediately across all three sites.
        </p>
      </div>

      {/* VAT settings */}
      <div style={{
        background: "#0d1520",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "0.875rem",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "2rem",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={{ color: "#d1d5db", fontSize: "0.875rem", fontWeight: 500 }}>VAT enabled</label>
          <button
            onClick={() => setVatEnabled(!vatEnabled)}
            style={{
              width: 44, height: 24,
              background: vatEnabled ? "#22c55e" : "#374151",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute",
              top: 2,
              left: vatEnabled ? 22 : 2,
              width: 20, height: 20,
              background: "white",
              borderRadius: "50%",
              transition: "left 0.2s",
            }} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={{ color: "#d1d5db", fontSize: "0.875rem", fontWeight: 500 }}>VAT rate (%)</label>
          <input
            type="number"
            value={vatRate}
            onChange={e => setVatRate(e.target.value)}
            style={{
              width: 80,
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "0.375rem",
              padding: "0.375rem 0.625rem",
              color: "#f9fafb",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Pricing table */}
      <div style={{
        background: "#0d1520",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "0.875rem",
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Programme", "Audience", "Individual (excl. VAT)", "Corporate (excl. VAT)", "Active"].map(h => (
                <th key={h} style={{
                  padding: "0.875rem 1.25rem",
                  textAlign: "left",
                  color: "#6b7280",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((course, i) => (
              <tr key={course.id} style={{
                borderBottom: i < courses.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <td style={{ padding: "1rem 1.25rem", color: "#f9fafb", fontSize: "0.875rem", fontWeight: 500 }}>
                  {course.name}
                </td>
                <td style={{ padding: "1rem 1.25rem" }}>
                  <span style={{
                    background: `${audienceColor(course.audience)}18`,
                    color: audienceColor(course.audience),
                    border: `1px solid ${audienceColor(course.audience)}30`,
                    borderRadius: "1rem",
                    padding: "0.2rem 0.625rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}>
                    {audienceLabel(course.audience)}
                  </span>
                </td>
                <td style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>R</span>
                    <input
                      type="number"
                      value={course.price_individual}
                      onChange={e => updatePrice(course.id, "price_individual", e.target.value)}
                      style={{
                        width: 100,
                        background: "#111827",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "0.375rem",
                        padding: "0.375rem 0.625rem",
                        color: "#f9fafb",
                        fontSize: "0.875rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </td>
                <td style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>R</span>
                    <input
                      type="number"
                      value={course.price_corporate}
                      onChange={e => updatePrice(course.id, "price_corporate", e.target.value)}
                      style={{
                        width: 100,
                        background: "#111827",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "0.375rem",
                        padding: "0.375rem 0.625rem",
                        color: "#f9fafb",
                        fontSize: "0.875rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </td>
                <td style={{ padding: "1rem 1.25rem" }}>
                  <button
                    onClick={() => setCourses(prev => prev.map(c => c.id === course.id ? { ...c, active: !c.active } : c))}
                    style={{
                      width: 40, height: 22,
                      background: course.active ? "#22c55e" : "#374151",
                      borderRadius: 11,
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s",
                    }}
                  >
                    <span style={{
                      position: "absolute",
                      top: 2,
                      left: course.active ? 20 : 2,
                      width: 18, height: 18,
                      background: "white",
                      borderRadius: "50%",
                      transition: "left 0.2s",
                    }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.625rem 1.5rem",
            fontSize: "0.9375rem",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving && <Loader2 size={16} />}
          Save pricing
        </button>
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#22c55e", fontSize: "0.875rem" }}>
            <CheckCircle size={16} />
            Saved successfully
          </div>
        )}
      </div>
    </div>
  );
}
