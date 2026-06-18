import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { moodleGetCourseModules, normalizeProgrammeSlug } from "@/lib/moodle";
import { CheckCircle2, Clock, PlayCircle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Programme | BetterDriver",
  description: "Track your progress through the Professional Truck Driver programme.",
};

export default async function CoursePage() {
  const session = await getSession();

  // Default empty state for unauthenticated / no moodle
  let programmeTitle = "The Professional Truck Driver Programme";
  let progressPercent = 0;
  let completedCount = 0;
  let totalModules = 0;
  let mappedModules: {
    id: string;
    name: string;
    status: "completed" | "in_progress" | "available";
    url?: string;
    order: number;
    percentWatched?: number;
  }[] = [];

  if (session) {
    const { data: driver } = await supabaseAdmin
      .from("drivers")
      .select("id, moodle_user_id")
      .eq("id", session.driverId)
      .single();

    const { data: enrolment } = await supabaseAdmin
      .from("enrolments")
      .select("programme_slug, status, progress_percent, modules_completed")
      .eq("driver_id", session.driverId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const programmeSlug = enrolment?.programme_slug ?? "ptdp";
    const canonicalSlug = normalizeProgrammeSlug(programmeSlug);

    programmeTitle =
      canonicalSlug === "professional-truck-driver"
        ? "The Professional Truck Driver Programme"
        : "Eco-Driver Training";

    if (driver?.moodle_user_id) {
      try {
        const modules = await moodleGetCourseModules({
          moodleUserId: driver.moodle_user_id,
          programmeSlug: canonicalSlug,
        });

        // Fetch partial progress from BD so we can show "in progress" for
        // modules that have been started but not yet completed in Moodle.
        const { data: partialProgress } = await supabaseAdmin
          .from("driver_module_progress")
          .select("module_id, percent_watched")
          .eq("driver_id", session.driverId);

        const partialMap = new Map(
          (partialProgress ?? []).map((p) => [String(p.module_id), p.percent_watched as number])
        );

        let foundIncomplete = false;
        mappedModules = modules.map((mod, index) => {
          const isComplete = mod.completionstate === 1 || mod.completionstate === 2;
          const isFail = mod.completionstate === 3;
          const partialPercent = partialMap.get(String(mod.id));

          let status: "completed" | "in_progress" | "available" = "available";
          if (isComplete) {
            status = "completed";
          } else if (isFail) {
            status = "available";
          } else if (partialPercent && partialPercent > 0) {
            status = "in_progress";
          } else if (!foundIncomplete) {
            status = "in_progress";
            foundIncomplete = true;
          } else {
            status = "available";
          }

          return {
            id: String(mod.id),
            name: mod.name,
            url: mod.url,
            status,
            order: index + 1,
            percentWatched: partialPercent,
          };
        });

        completedCount = mappedModules.filter((m) => m.status === "completed").length;
        totalModules = mappedModules.length;
        progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
      } catch (err) {
        console.error("[COURSE] Moodle fetch failed:", err);
      }
    }
  }

  const inProgress = mappedModules.find((m) => m.status === "in_progress");
  const nextModule = inProgress ?? mappedModules.find((m) => m.status === "available");

  return (
    <div className="page-content">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#F9FAFB", margin: "0 0 0.375rem" }}>
          {programmeTitle}
        </h1>
        <p style={{ color: "#9CA3AF", margin: 0, fontSize: "0.9375rem" }}>
          {completedCount} of {totalModules} modules complete
        </p>
      </div>

      {/* Progress summary card */}
      <div
        style={{
          background: "#1C2333",
          border: "1px solid #2d3a4f",
          borderRadius: "1.25rem",
          padding: "1.5rem 2rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <div>
          <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: "0 0 0.25rem" }}>Your progress</p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, fontSize: "2rem", color: "#F59E0B", margin: "0 0 0.5rem" }}>
            {progressPercent}%
          </p>
          <div className="progress-bar" style={{ width: 200 }}>
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "2rem" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
              {completedCount}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>Done</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
              {totalModules - completedCount}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>Remaining</p>
          </div>
        </div>
        {/* Continue / Start CTA */}
        {nextModule && (
          <Link
            href={`/portal/module/${nextModule.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#F59E0B",
              color: "#111827",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: 700,
              fontSize: "0.9375rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
            }}
          >
            {inProgress ? "Continue" : "Start"} <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {/* Module list */}
      <h2 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "1.125rem", color: "#F9FAFB", marginBottom: "1rem" }}>
        All modules
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {mappedModules.map((mod, i) => (
          <Link
            key={mod.id}
            href={`/portal/module/${mod.id}`}
            style={{
              background: "#1C2333",
              border: `1px solid ${mod.status === "in_progress" ? "rgba(245,158,11,0.35)" : "#2d3a4f"}`,
              borderRadius: "0.875rem",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background:
                  mod.status === "completed"
                    ? "rgba(16,185,129,0.12)"
                    : mod.status === "in_progress"
                      ? "rgba(245,158,11,0.12)"
                      : "#243044",
                border: `1px solid ${mod.status === "completed" ? "rgba(16,185,129,0.25)" : mod.status === "in_progress" ? "rgba(245,158,11,0.25)" : "#2d3a4f"}`,
                borderRadius: "0.625rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {mod.status === "completed" ? (
                <CheckCircle2 size={16} style={{ color: "#10B981" }} />
              ) : mod.status === "in_progress" ? (
                <PlayCircle size={16} style={{ color: "#F59E0B" }} />
              ) : (
                <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "#6B7280" }}>
                  {i + 1}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#F9FAFB", margin: "0 0 0.125rem" }}>
                {mod.name}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Clock size={12} />
                {mod.status === "completed"
                  ? "Done"
                  : mod.percentWatched
                    ? `${mod.percentWatched}% watched`
                    : "Available"}
              </p>
            </div>
            {mod.status === "in_progress" && (
              <span className="pill pill-amber" style={{ fontSize: "0.6875rem" }}>
                In progress
              </span>
            )}
            {mod.status === "completed" && (
              <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>
                Done
              </span>
            )}
            {mod.status !== "completed" && (
              <ArrowRight size={16} style={{ color: "#6B7280", flexShrink: 0 }} />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}