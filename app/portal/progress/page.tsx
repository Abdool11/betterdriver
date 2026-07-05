import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import { moodleGetCourseModules, normalizeProgrammeSlug } from "@/lib/moodle";
import { CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Progress" };

export default async function ProgressPage() {
  const session = await getSession();

  let progressPercent = 0;
  let completedModulesCount = 0;
  let totalModules = 0;
  let modules: { id: string; name: string; status: "completed" | "in_progress" | "available" }[] = [];

  let cpdTotal = 0;
  let cpdCompleted = 0;
  let cpdOverdue = 0;
  let cpdHistory: { id: string; title: string; completedAt: string }[] = [];

  if (session) {
    const { data: driver } = await supabaseAdmin
      .from("drivers")
      .select("id, moodle_user_id")
      .eq("id", session.driverId)
      .single();

    const { data: enrolment } = await supabaseAdmin
      .from("enrolments")
      .select("programme_slug, progress_percent, modules_completed")
      .eq("driver_id", session.driverId)
      .in("status", ACTIVE_ENROLMENT_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrolment) {
      progressPercent = enrolment.progress_percent ?? 0;
      completedModulesCount = enrolment.modules_completed ?? 0;
    }

    if (driver?.moodle_user_id && enrolment?.programme_slug) {
      try {
        const canonicalSlug = normalizeProgrammeSlug(enrolment.programme_slug);
        const moodleModules = await moodleGetCourseModules({
          moodleUserId: driver.moodle_user_id,
          programmeSlug: canonicalSlug,
        });

        const supabaseCompleted = enrolment?.modules_completed ?? 0;
        let foundIncomplete = false;
        modules = moodleModules.map((mod, index) => {
          const isComplete = mod.completionstate === 1 || mod.completionstate === 2 || index < supabaseCompleted;
          const isFail = mod.completionstate === 3;

          let status: "completed" | "in_progress" | "available" = "available";
          if (isComplete) {
            status = "completed";
          } else if (isFail) {
            status = "available";
          } else if (!foundIncomplete) {
            status = "in_progress";
            foundIncomplete = true;
          } else {
            status = "available";
          }

          return { id: String(mod.id), name: mod.name, status };
        });

        // Only show completed modules and the current (in-progress) module
        // Future/locked modules are hidden from the driver
        const allModules = [...modules];
        modules = modules.filter((m) => m.status === "completed" || m.status === "in_progress");

        // Use full module count for stats so progress is accurate
        totalModules = allModules.length;
        completedModulesCount = allModules.filter((m) => m.status === "completed").length;
        progressPercent = totalModules > 0 ? Math.round((completedModulesCount / totalModules) * 100) : 0;
      } catch (err) {
        console.error("[PROGRESS] Moodle fetch failed:", err);
      }
    }

    // CPD stats
    const now = new Date();
    const { data: cpdRows } = await supabaseAdmin
      .from("driver_cpd_participation")
      .select(
        `id, completed_at,
         cpd_modules(id, title, due_date)`
      )
      .eq("driver_id", session.driverId);

    for (const row of cpdRows ?? []) {
      cpdTotal++;
      const mod = row.cpd_modules as unknown as { title?: string; due_date?: string } | null;
      if (row.completed_at) {
        cpdCompleted++;
        cpdHistory.push({
          id: row.id,
          title: mod?.title ?? "CPD Module",
          completedAt: new Date(row.completed_at).toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        });
      } else if (mod?.due_date && new Date(mod.due_date) < now) {
        cpdOverdue++;
      }
    }

    // Legacy cpd_records
    const { data: legacy } = await supabaseAdmin
      .from("cpd_records")
      .select("id, module_title, completed_at")
      .eq("driver_id", session.driverId)
      .order("completed_at", { ascending: false });

    for (const r of legacy ?? []) {
      if (!cpdHistory.find((h) => h.title === (r.module_title ?? "CPD Module"))) {
        cpdHistory.push({
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
        cpdTotal++;
        cpdCompleted++;
      }
    }
  }

  const cpdDue = cpdOverdue > 0 || cpdTotal - cpdCompleted > 0;

  return (
    <div className="page-content">
      <TranslatedPageHeader pageKey="progress" />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Course progress", value: `${progressPercent}%`, color: "#F59E0B" },
          { label: "Modules completed", value: `${completedModulesCount}/${totalModules}`, color: "#10B981" },
          { label: "CPD sessions done", value: `${cpdCompleted}/${cpdTotal}`, color: "#3B82F6" },
          { label: "Next CPD due", value: cpdOverdue > 0 ? `${cpdOverdue} overdue` : cpdDue ? "Due soon" : "No CPD due", color: cpdOverdue > 0 ? "#EF4444" : "#9CA3AF" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "1rem", padding: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, fontSize: "1.75rem", color, margin: "0 0 0.25rem" }}>
              {value}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Module progress */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "#F9FAFB",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <TrendingUp size={18} style={{ color: "#F59E0B" }} /> Course modules
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {modules.map((mod) => (
            <div
              key={mod.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                padding: "0.75rem 1rem",
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "0.75rem",
              }}
            >
              {mod.status === "completed" ? (
                <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #2d3a4f", flexShrink: 0 }} />
              )}
              <p style={{ fontSize: "0.875rem", color: mod.status === "completed" ? "#F9FAFB" : "#6B7280", margin: 0, flex: 1 }}>
                {mod.name}
              </p>
              {mod.status === "in_progress" && (
                <span className="pill pill-amber" style={{ fontSize: "0.6875rem" }}>
                  In progress
                </span>
              )}
              {mod.status === "completed" && (
                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>Done</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CPD history */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "#F9FAFB",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Calendar size={18} style={{ color: "#3B82F6" }} /> CPD history
        </h2>
        {cpdHistory.length === 0 ? (
          <div style={{ padding: "1.25rem", background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "0.75rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>
              No CPD records yet. Complete your programme to unlock CPD tracking.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {cpdHistory.map((h) => (
              <div
                key={h.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  padding: "0.75rem 1rem",
                  background: "#1C2333",
                  border: "1px solid #2d3a4f",
                  borderRadius: "0.75rem",
                }}
              >
                <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />
                <p style={{ fontSize: "0.875rem", color: "#F9FAFB", margin: 0, flex: 1 }}>{h.title}</p>
                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{h.completedAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}