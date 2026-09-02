"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  initialValues: {
    bd_support_email: string;
    bd_support_phone: string;
    bd_whatsapp_number: string;
  };
}

export function SettingsClient({ initialValues }: Props) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveField(key: string, value: string) {
    setSaving(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(key);
      setTimeout(() => setSaved(null), 2500);
    } catch {
      setError(`Failed to save ${key}`);
    } finally {
      setSaving(null);
    }
  }

  const fields = [
    {
      key: "bd_support_email",
      label: "Support email address",
      type: "email",
      placeholder: "support@betterdriver.co.za",
      hint: "Displayed on the Help page and Portal Support page as the email contact.",
    },
    {
      key: "bd_support_phone",
      label: "Support phone number",
      type: "tel",
      placeholder: "+27 XX XXX XXXX",
      hint: "Displayed on the Help page as the call support option.",
    },
    {
      key: "bd_whatsapp_number",
      label: "WhatsApp support number",
      type: "tel",
      placeholder: "27XXXXXXXXX",
      hint: "Used in the wa.me link on the Help page. Format: country code + number, no spaces or + (e.g. 27831234567).",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#F9FAFB",
        fontFamily: "var(--font-dm-sans), sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          height: 65,
          background: "#0d1117",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
          gap: "1rem",
        }}
      >
        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#f97316" }}>
          BetterDriver
        </span>
        <span style={{ color: "#374151", fontSize: "1rem" }}>/</span>
        <span style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>Admin</span>
        <span style={{ color: "#374151", fontSize: "1rem" }}>/</span>
        <span style={{ color: "#F9FAFB", fontSize: "0.875rem" }}>Settings</span>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 208,
            background: "#0d1117",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "1.5rem 0.75rem",
            flexShrink: 0,
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {[
              { href: "/admin/dashboard", label: "Dashboard" },
              { href: "/admin/invitations", label: "Invitations" },
              { href: "/admin/bulletins", label: "Bulletins" },
              { href: "/admin/cpd", label: "CPD Modules" },
              { href: "/admin/programmes", label: "Programmes" },
              { href: "/admin/settings", label: "Settings", active: true },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "block",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  color: item.active ? "#f97316" : "#9CA3AF",
                  background: item.active ? "rgba(249,115,22,0.1)" : "transparent",
                  textDecoration: "none",
                  fontWeight: item.active ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "2rem 2.5rem", maxWidth: 720 }}>
          <div style={{ marginBottom: "2rem" }}>
            <h1
              style={{
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "#F9FAFB",
                margin: "0 0 0.375rem",
              }}
            >
              Contact Settings
            </h1>
            <p style={{ color: "#9CA3AF", margin: 0, fontSize: "0.875rem" }}>
              These values are displayed on the public Help page and the driver Portal Support page.
              Changes take effect immediately — no redeployment needed.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "0.75rem",
                padding: "0.875rem 1rem",
                color: "#FCA5A5",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {fields.map((field) => (
              <div
                key={field.key}
                style={{
                  background: "#161b27",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: "#F9FAFB",
                    marginBottom: "0.375rem",
                  }}
                >
                  {field.label}
                </label>
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: "0.8rem",
                    margin: "0 0 0.875rem",
                  }}
                >
                  {field.hint}
                </p>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <input
                    type={field.type}
                    value={values[field.key as keyof typeof values]}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    style={{
                      flex: 1,
                      background: "#0d1117",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 0.875rem",
                      color: "#F9FAFB",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => saveField(field.key, values[field.key as keyof typeof values])}
                    disabled={saving === field.key}
                    style={{
                      background:
                        saving === field.key
                          ? "#374151"
                          : saved === field.key
                          ? "#10B981"
                          : "#f97316",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.5rem",
                      padding: "0.625rem 1.25rem",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: saving === field.key ? "not-allowed" : "pointer",
                      transition: "background 0.2s",
                      minWidth: 80,
                    }}
                  >
                    {saving === field.key
                      ? "Saving…"
                      : saved === field.key
                      ? "Saved ✓"
                      : "Save"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
