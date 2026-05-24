"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface ConfigField {
  key: string;
  label: string;
  type?: "text" | "email" | "password" | "textarea" | "select" | "toggle";
  placeholder?: string;
  options?: { value: string; label: string }[];
  hint?: string;
}

interface ConfigFormProps {
  title: string;
  description: string;
  fields: ConfigField[];
  initialValues: Record<string, string>;
  saveAction: (data: Record<string, string>) => Promise<void>;
}

export default function ConfigForm({
  title,
  description,
  fields,
  initialValues,
  saveAction,
}: ConfigFormProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await saveAction(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "#f9fafb", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{title}</h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.9375rem" }}>{description}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          background: "#0d1520",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "0.875rem",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}>
          {fields.map((field) => (
            <div key={field.key}>
              <label style={{
                display: "block",
                color: "#d1d5db",
                fontSize: "0.8125rem",
                fontWeight: 500,
                marginBottom: "0.375rem",
              }}>
                {field.label}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={4}
                  style={{
                    width: "100%",
                    background: "#111827",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.5rem",
                    padding: "0.625rem 0.875rem",
                    color: "#f9fafb",
                    fontSize: "0.875rem",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              ) : field.type === "select" ? (
                <select
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  style={{
                    width: "100%",
                    background: "#111827",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.5rem",
                    padding: "0.625rem 0.875rem",
                    color: "#f9fafb",
                    fontSize: "0.875rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type ?? "text"}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{
                    width: "100%",
                    background: "#111827",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.5rem",
                    padding: "0.625rem 0.875rem",
                    color: "#f9fafb",
                    fontSize: "0.875rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}

              {field.hint && (
                <p style={{ color: "#4b5563", fontSize: "0.75rem", marginTop: "0.375rem" }}>
                  {field.hint}
                </p>
              )}
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingTop: "0.5rem" }}>
            <button
              type="submit"
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
              {saving && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              Save changes
            </button>
            {saved && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#22c55e", fontSize: "0.875rem" }}>
                <CheckCircle size={16} />
                Saved successfully
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
