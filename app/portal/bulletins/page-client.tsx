"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, ChevronRight, CheckCircle2, Clock } from "lucide-react";

interface BulletinSummary {
  id: string;
  title: string;
  category: string;
  urgency: "urgent" | "standard";
  sender_company: string;
  disseminated_at: string;
  read: boolean;
}

// Mock data — replace with live Supabase fetch
const MOCK_BULLETINS: BulletinSummary[] = [
  {
    id: "b-001",
    title: "Tyre blowout response — updated procedure",
    category: "Safety",
    urgency: "urgent",
    sender_company: "Transnet Freight",
    disseminated_at: "2025-04-18T08:00:00Z",
    read: false,
  },
  {
    id: "b-002",
    title: "New rest stop facilities on N3 corridor",
    category: "Operations",
    urgency: "standard",
    sender_company: "Transnet Freight",
    disseminated_at: "2025-04-10T09:00:00Z",
    read: true,
  },
];

export default function BulletinsListPage() {
  const [bulletins, setBulletins] = useState<BulletinSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with live fetch from /api/portal/bulletins
    setTimeout(() => {
      setBulletins(MOCK_BULLETINS);
      setLoading(false);
    }, 300);
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
        <div
          style={{
            width: 40,
            height: 40,
            background: "rgba(245,158,11,0.1)",
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bell size={20} color="#F59E0B" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#F9FAFB", margin: 0 }}>
            Bulletins
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>
            Safety and operational updates from your company
          </p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "#6B7280" }}>
          Loading bulletins…
        </div>
      ) : bulletins.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            background: "#0d1117",
            borderRadius: "1rem",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Bell size={32} color="#374151" style={{ marginBottom: "0.75rem" }} />
          <p style={{ color: "#6B7280", margin: 0 }}>No bulletins yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {bulletins.map((b) => (
            <Link
              key={b.id}
              href={`/portal/bulletins/${b.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                background: b.read ? "#0d1117" : "rgba(245,158,11,0.04)",
                border: b.read
                  ? "1px solid rgba(255,255,255,0.07)"
                  : "1px solid rgba(245,158,11,0.2)",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
                textDecoration: "none",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  background:
                    b.urgency === "urgent"
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(245,158,11,0.1)",
                  borderRadius: "0.625rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {b.urgency === "urgent" ? (
                  <AlertTriangle size={16} color="#EF4444" />
                ) : (
                  <Bell size={16} color="#F59E0B" />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: b.read ? 600 : 700,
                    fontSize: "0.875rem",
                    color: "#F9FAFB",
                    margin: "0 0 0.25rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {b.title}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color:
                        b.urgency === "urgent" ? "#EF4444" : "#6B7280",
                      fontWeight: b.urgency === "urgent" ? 700 : 400,
                    }}
                  >
                    {b.urgency === "urgent" ? "Urgent" : b.category}
                  </span>
                  <span style={{ color: "#374151", fontSize: "0.75rem" }}>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#6B7280" }}>
                    <Clock size={11} />
                    {formatDate(b.disseminated_at)}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {b.read ? (
                  <CheckCircle2 size={16} color="#22C55E" />
                ) : (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      background: "#F59E0B",
                      borderRadius: "50%",
                    }}
                  />
                )}
                <ChevronRight size={14} color="#6B7280" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
