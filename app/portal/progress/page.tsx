import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
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
  let modules: { id: string; name: string; status: "completed" | "in_progress" | "available" | "locked" }[] = [];
  let cpdDue = false;

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
      .eq("status", "active")
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

        let foundIncomplete = false;
        modules = moodleModules.map((mod) => {
          const isComplete = mod.completionstate === 1 || mod.completionstate === 2;
          const isFail = mod.completionstate === 3;

          let status: "completed" | "in_progress" | "available" | "locked" = "locked";
          if (isComplete) {
            status = "completed";
          } else if (isFail) {
            status = "available";
          } else if (!foundIncomplete) {
            status = "in_progress";
            foundIncomplete = true;
          } else {
            status = "locked";
          }

          return { id: String(mod.id), name: mod.name, status };
        });

        totalModules = modules.length;
        completedModulesCount = modules.filter((m) => m.status === "completed").length;
        progressPercent = totalModules > 0 ? Math.round((completedModulesCount / totalModules) * 100) : 0;
      } catch (err) {
        console.error("[PROGRESS] Moodle fetch failed:", err);
      }
    }
  }

  return (
    <div className="page-content">
      <TranslatedPageHeader pageKey="progress" />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Course progress", value: `${progressPercent}%`, color: "#F59E0B" },
          { label: "Modules completed", value: `${completedModulesCount}/${totalModules}`, color: "#10B981" },
          { label: "CPD sessions done", value: `0`, color: "#3B82F6" },
          { label: "Next CPD due", value: cpdDue ? "Due soon" : "No CPD due", color: "#9CA3AF" },
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
        <div style={{ padding: "1.25rem", background: "#1C2333", border: "1px solid #2d3a4f", borderRadius: "0.75rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>
            No CPD records yet. Complete your programme to unlock CPD tracking.
          </p>
        </div>
      </div>
    </div>
  );
}