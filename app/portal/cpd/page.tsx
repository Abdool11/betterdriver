import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "CPD & Refresh" };

export default async function CpdPage() {
  const session = await getSession();
  let urgent: { id: string; title: string; dueDate: string }[] = [];
  let upcoming: { id: string; title: string; dueDate: string }[] = [];
  let completed: { id: string; title: string; completedAt: string }[] = [];

  if (session) {
    const now = new Date();
    const fourteenDays = new Date();
    fourteenDays.setDate(now.getDate() + 14);

    // Fetch assigned CPD modules via participation
    const { data: rows } = await supabaseAdmin
      .from("driver_cpd_participation")
      .select(
        `id, completed_at,
         cpd_modules(id, title, due_date)`
      )
      .eq("driver_id", session.driverId);

    for (const row of rows ?? []) {
      const mod = row.cpd_modules as unknown as { id: string; title?: string; due_date?: string } | null;
      const title = mod?.title ?? "CPD Module";
      const due = mod?.due_date ? new Date(mod.due_date) : null;

      if (row.completed_at) {
        completed.push({
          id: row.id,
          title,
          completedAt: new Date(row.completed_at).toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        });
        continue;
      }

      if (due) {
        const dueStr = due.toLocaleDateString("en-ZA", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        if (due < now) {
          urgent.push({ id: row.id, title, dueDate: dueStr });
        } else if (due <= fourteenDays) {
          upcoming.push({ id: row.id, title, dueDate: dueStr });
        }
      }
    }

    // Also fetch legacy cpd_records that may not have a participation row
    const { data: legacy } = await supabaseAdmin
      .from("cpd_records")
      .select("id, module_title, completed_at")
      .eq("driver_id", session.driverId)
      .order("completed_at", { ascending: false });

    for (const r of legacy ?? []) {
      if (!completed.find((c) => c.title === (r.module_title ?? "CPD Module"))) {
        completed.push({
          id: r.id,
          title: r.module_title ?? "CPD Module",
          completedAt: r.completed_at
            ? new Date(r.completed_at).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "",
        });
      }
    }
  }

  const hasAny = urgent.length > 0 || upcoming.length > 0 || completed.length > 0;

  return (
    <div className="page-content">
      <TranslatedPageHeader pageKey="cpd" />

      {!hasAny && (
        <div
          style={{
            background: "#1C2333",
            border: "1px solid #2d3a4f",
            borderRadius: "1rem",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.9375rem", color: "#9CA3AF", margin: "0 0 0.5rem" }}>
            No CPD modules assigned yet.
          </p>
          <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>
            Complete your programme to unlock CPD tracking.
          </p>
        </div>
      )}

      {/* Urgent / action required */}
      {urgent.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
            <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
            <h2 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F59E0B", margin: 0 }}>
              Action required ({urgent.length})
            </h2>
          </div>
          {urgent.map((r) => (
            <div
              key={r.id}
              style={{
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "1rem",
                padding: "1.25rem",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <Clock size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
                  {r.title}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>Due {r.dueDate}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#9CA3AF", marginBottom: "0.875rem" }}>
            Upcoming
          </h2>
          {upcoming.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "1rem",
                padding: "1.25rem",
                marginBottom: "0.75rem",
                opacity: 0.7,
              }}
            >
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#9CA3AF", margin: "0 0 0.25rem" }}>
                {r.title}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>Due {r.dueDate}</p>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#9CA3AF", marginBottom: "0.875rem" }}>
            Completed
          </h2>
          {completed.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "1rem",
                padding: "1.25rem",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <CheckCircle2 size={18} style={{ color: "#10B981", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#F9FAFB", margin: "0 0 0.125rem" }}>
                  {r.title}
                </p>
                {r.completedAt && (
                  <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>Completed {r.completedAt}</p>
                )}
              </div>
              <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>
                Done
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}