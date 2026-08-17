"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

export default function ReaccessRequestForm() {
  const [mobile, setMobile] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/reaccess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
    } finally {
      setBusy(false);
      setSent(true);
    }
  }

  return (
    <section style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem", margin: "1.5rem 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
        <MessageCircle size={18} color="#F59E0B" />
        <h2 style={{ margin: 0, color: "#F9FAFB", fontSize: "1rem" }}>Need a new access link?</h2>
      </div>
      {sent ? (
        <p style={{ margin: 0, color: "#D1D5DB", lineHeight: 1.5 }}>If your mobile number is registered, a secure BetterDriver link will arrive on WhatsApp shortly.</p>
      ) : (
        <form onSubmit={submit}>
          <p style={{ margin: "0 0 0.85rem", color: "#9CA3AF", lineHeight: 1.5 }}>Enter the mobile number your company used to enrol you. We will send a secure link if it matches an active driver record.</p>
          <input aria-label="Registered mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} required inputMode="tel" placeholder="e.g. 082 123 4567" style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #455168", background: "#111827", color: "#F9FAFB", marginBottom: "0.7rem" }} />
          <button type="submit" disabled={busy} style={{ width: "100%", padding: "0.75rem", border: 0, borderRadius: "0.5rem", background: "#F59E0B", color: "#111827", fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>{busy ? "Sending…" : "Send my secure link"}</button>
        </form>
      )}
    </section>
  );
}
