import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { moodleGetCourseModules, normalizeProgrammeSlug } from "@/lib/moodle";
import { CheckCircle2, PlayCircle, ArrowRight } from "lucide-react";
import MoodleIframe from "./MoodleIframe";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Module | BetterDriver`,
  };
}

export default async function ModuleLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  let moduleName = "Module";
  let moduleIndex = 0;
  let totalModules = 0;
  let isComplete = false;
  let moduleUrl: string | undefined;
  let nextModuleId: string | null = null;
  let prevModuleId: string | null = null;

  if (session) {
    const { data: driver } = await supabaseAdmin
      .from("drivers")
      .select("id, moodle_user_id")
      .eq("id", session.driverId)
      .single();

    const { data: enrolment } = await supabaseAdmin
      .from("enrolments")
      .select("programme_slug")
      .eq("driver_id", session.driverId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (driver?.moodle_user_id && enrolment?.programme_slug) {
      try {
        const canonicalSlug = normalizeProgrammeSlug(enrolment.programme_slug);
        const modules = await moodleGetCourseModules({
          moodleUserId: driver.moodle_user_id,
          programmeSlug: canonicalSlug,
        });

        totalModules = modules.length;
        const modIndex = modules.findIndex((m) => String(m.id) === id);
        if (modIndex >= 0) {
          const mod = modules[modIndex];
          moduleName = mod.name;
          moduleIndex = modIndex;
          isComplete = mod.completionstate === 1 || mod.completionstate === 2;
          moduleUrl = mod.url;
          if (modIndex + 1 < modules.length) {
            nextModuleId = String(modules[modIndex + 1].id);
          }
          if (modIndex > 0) {
            prevModuleId = String(modules[modIndex - 1].id);
          }
        }
      } catch (err) {
        console.error("[MODULE] Moodle fetch failed:", err);
      }
    }
  }

  return (
    <div className="page-content">
      {/* Back link */}
      <Link
        href="/portal/course"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          color: "#9CA3AF",
          fontSize: "0.875rem",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        ← Back to programme
      </Link>

      {/* Module header */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "2rem",
            padding: "0.25rem 0.875rem",
            marginBottom: "0.875rem",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#F59E0B" }}>
            Module {moduleIndex + 1} of {totalModules}
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 800,
            fontSize: "1.75rem",
            color: "#F9FAFB",
            margin: "0 0 0.75rem",
            lineHeight: 1.2,
          }}
        >
          {moduleName}
        </h1>
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
          {isComplete ? (
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "#10B981" }}>
              <CheckCircle2 size={13} /> Completed
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "#F59E0B" }}>
              <PlayCircle size={13} /> In progress
            </span>
          )}
        </div>
      </div>

      {/* Moodle iframe — auto-login via signed JWT, with fallback */}
      {moduleUrl && <MoodleIframe moduleUrl={moduleUrl} moduleName={moduleName} />}

      {/* Completion status */}
      <div
        style={{
          background: "#1C2333",
          border: `1px solid ${isComplete ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
          borderRadius: "1rem",
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "0.625rem",
            background: isComplete ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
            border: `1px solid ${isComplete ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isComplete ? (
            <CheckCircle2 size={18} style={{ color: "#10B981" }} />
          ) : (
            <PlayCircle size={18} style={{ color: "#F59E0B" }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: "#F9FAFB",
              margin: "0 0 0.125rem",
            }}
          >
            {isComplete ? "Module complete" : "Module in progress"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>
            {isComplete
              ? "You have completed this module. Great work!"
              : "Finish the activity above to mark this module complete."}
          </p>
        </div>
        {isComplete && (
          <span className="pill pill-green" style={{ fontSize: "0.6875rem" }}>Done</span>
        )}
      </div>

      {/* Navigation between modules */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        {prevModuleId ? (
          <Link
            href={`/portal/module/${prevModuleId}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#9CA3AF",
              fontSize: "0.9375rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ← Previous module
          </Link>
        ) : (
          <div />
        )}
        {nextModuleId && (
          <Link
            href={`/portal/module/${nextModuleId}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#14b8a6",
              fontSize: "0.9375rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Next module <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}