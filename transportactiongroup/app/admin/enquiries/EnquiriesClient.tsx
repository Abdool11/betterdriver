"use client";

import { useState } from "react";
import { Mail, Building2, Phone, Calendar, Tag, Download } from "lucide-react";

interface Enquiry {
  id: string;
  source: string;
  name: string;
  organisation: string;
  email: string;
  phone: string;
  role: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  tag_partnership: "TAG Partnership",
  tag_contact: "TAG Contact",
  gfa_booking: "GFA Booking",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#f59e0b",
  read: "#3b82f6",
  replied: "#22c55e",
  archived: "#6b7280",
};

export default function EnquiriesClient({ enquiries: initial }: { enquiries: Enquiry[] }) {
  const [enquiries, setEnquiries] = useState(initial);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? enquiries : enquiries.filter(e => e.status === filter || e.source === filter);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const exportCSV = () => {
    const headers = ["Date", "Source", "Name", "Organisation", "Email", "Phone", "Role", "Subject", "Message", "Status"];
    const rows = enquiries.map(e => [
      new Date(e.created_at).toLocaleDateString(),
      SOURCE_LABELS[e.source] ?? e.source,
      e.name, e.organisation, e.email, e.phone, e.role, e.subject,
      `"${(e.message ?? "").replace(/"/g, '""')}"`,
      e.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div style={{ display: "flex", gap: "1.5rem", height: "calc(100vh - 4rem)" }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <h1 style={{ color: "#f9fafb", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Enquiry Inbox</h1>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              {enquiries.filter(e => e.status === "new").length} new · {enquiries.length} total
            </p>
          </div>
          <button onClick={exportCSV} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0.5rem", padding: "0.5rem 1rem",
            color: "#9ca3af", fontSize: "0.8125rem", cursor: "pointer",
          }}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          {["all", "new", "read", "replied", "tag_partnership", "gfa_booking"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "1rem",
              border: "1px solid",
              borderColor: filter === f ? "#22c55e" : "rgba(255,255,255,0.08)",
              background: filter === f ? "rgba(34,197,94,0.1)" : "transparent",
              color: filter === f ? "#22c55e" : "#6b7280",
              fontSize: "0.75rem",
              fontWeight: 500,
              cursor: "pointer",
              textTransform: "capitalize",
            }}>
              {f === "all" ? "All" : f === "tag_partnership" ? "TAG Partnership" : f === "gfa_booking" ? "GFA Booking" : f}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#4b5563" }}>
              No enquiries found.
            </div>
          ) : filtered.map(e => (
            <div
              key={e.id}
              onClick={() => { setSelected(e); updateStatus(e.id, e.status === "new" ? "read" : e.status); }}
              style={{
                background: selected?.id === e.id ? "#111827" : "#0d1520",
                border: `1px solid ${selected?.id === e.id ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "0.75rem",
                padding: "1rem 1.25rem",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    {e.status === "new" && (
                      <span style={{ width: 7, height: 7, background: "#f59e0b", borderRadius: "50%", flexShrink: 0 }} />
                    )}
                    <span style={{ color: "#f9fafb", fontWeight: 600, fontSize: "0.875rem" }}>{e.name}</span>
                    {e.organisation && <span style={{ color: "#6b7280", fontSize: "0.8125rem" }}>· {e.organisation}</span>}
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: "0.8125rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.subject || e.message?.slice(0, 80)}
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <span style={{
                    background: `${STATUS_COLORS[e.status] ?? "#6b7280"}18`,
                    color: STATUS_COLORS[e.status] ?? "#6b7280",
                    border: `1px solid ${STATUS_COLORS[e.status] ?? "#6b7280"}30`,
                    borderRadius: "1rem",
                    padding: "0.15rem 0.5rem",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "0.25rem",
                  }}>
                    {e.status}
                  </span>
                  <span style={{ color: "#4b5563", fontSize: "0.7rem" }}>
                    {new Date(e.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{
        width: 380,
        background: "#0d1520",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "0.875rem",
        padding: "1.5rem",
        overflowY: "auto",
        flexShrink: 0,
      }}>
        {!selected ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#4b5563" }}>
            <Mail size={32} style={{ margin: "0 auto 1rem", display: "block" }} />
            Select an enquiry to view details
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <span style={{
                background: "rgba(34,197,94,0.1)",
                color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "1rem",
                padding: "0.2rem 0.625rem",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}>
                {SOURCE_LABELS[selected.source] ?? selected.source}
              </span>
            </div>

            <h2 style={{ color: "#f9fafb", fontWeight: 700, fontSize: "1.125rem", margin: "0 0 0.25rem" }}>
              {selected.name}
            </h2>
            {selected.role && <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>{selected.role}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
              {selected.organisation && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", color: "#9ca3af", fontSize: "0.8125rem" }}>
                  <Building2 size={14} /> {selected.organisation}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", color: "#9ca3af", fontSize: "0.8125rem" }}>
                <Mail size={14} />
                <a href={`mailto:${selected.email}`} style={{ color: "#3b82f6" }}>{selected.email}</a>
              </div>
              {selected.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", color: "#9ca3af", fontSize: "0.8125rem" }}>
                  <Phone size={14} /> {selected.phone}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", color: "#9ca3af", fontSize: "0.8125rem" }}>
                <Calendar size={14} /> {new Date(selected.created_at).toLocaleString()}
              </div>
            </div>

            {selected.subject && (
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Subject</p>
                <p style={{ color: "#d1d5db", fontSize: "0.875rem", margin: 0 }}>{selected.subject}</p>
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Message</p>
              <p style={{ color: "#d1d5db", fontSize: "0.875rem", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{selected.message}</p>
            </div>

            {/* Status actions */}
            <div>
              <p style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.625rem" }}>Update status</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["new", "read", "replied", "archived"].map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "1rem",
                    border: "1px solid",
                    borderColor: selected.status === s ? STATUS_COLORS[s] : "rgba(255,255,255,0.08)",
                    background: selected.status === s ? `${STATUS_COLORS[s]}18` : "transparent",
                    color: selected.status === s ? STATUS_COLORS[s] : "#6b7280",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <a
                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Your enquiry")}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "white",
                  borderRadius: "0.5rem",
                  padding: "0.625rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Mail size={15} /> Reply via email
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
