import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { moodleGetCourseModules, normalizeProgrammeSlug, MOODLE_URL } from "@/lib/moodle";
import { CheckCircle2, PlayCircle, ArrowRight, AlertCircle, Lock } from "lucide-react";
import MoodleIframe from "./MoodleIframe";
import BunnyPlayer from "./BunnyPlayer";
import QuizPlayer from "./QuizPlayer";

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

  let moduleName = "";
  let moduleIndex = -1;
  let totalModules = 0;
  let isComplete = false;
  let moduleUrl = "";
  let nextModuleId: string | null = null;
  let prevModuleId: string | null = null;
  let loadError = "";
  let bunnyVideoId = "";
  let bunnyLibraryId = "";
  let modName = "";
  let quizId = 0;
  let isLocked = false;

  if (!session) {
    loadError = "Please sign in to view this module.";
  } else {
    const { data: driver } = await supabaseAdmin
      .from("drivers")
      .select("id, moodle_user_id")
      .eq("id", session.driverId)
      .single();

    // Try active enrolment first, then any enrolment, then fall back to ptdp
    let { data: enrolment } = await supabaseAdmin
      .from("enrolments")
      .select("programme_slug")
      .eq("driver_id", session.driverId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!enrolment?.programme_slug) {
      const { data: anyEnrolment } = await supabaseAdmin
        .from("enrolments")
        .select("programme_slug")
        .eq("driver_id", session.driverId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (anyEnrolment?.programme_slug) {
        enrolment = anyEnrolment;
      }
    }

    const programmeSlug = enrolment?.programme_slug ?? "ptdp";

    if (!driver?.moodle_user_id) {
      loadError = "Your account is not linked to Moodle yet.";
    } else {
      try {
        const canonicalSlug = normalizeProgrammeSlug(programmeSlug);
        const modules = await moodleGetCourseModules({
          moodleUserId: driver.moodle_user_id,
          programmeSlug: canonicalSlug,
        });

        totalModules = modules.length;
        if (totalModules === 0) {
          loadError = "Moodle returned an empty module list. Please check your course configuration.";
        } else {
          const modIndex = modules.findIndex((m) => String(m.id) === id);
          if (modIndex === -1) {
            loadError = `Module ID "${id}" was not found in your programme.`;
          } else {
            const mod = modules[modIndex];
            const modComplete = mod.completionstate === 1 || mod.completionstate === 2;

            // Check if this module is locked — i.e. there is an incomplete
            // module before it that the driver hasn't finished yet.
            // The driver can only access: completed modules, the current
            // (first incomplete) module, or the next available one.
            if (!modComplete) {
              const firstIncompleteIndex = modules.findIndex(
                (m) => m.completionstate !== 1 && m.completionstate !== 2
              );
              // If this module is after the first incomplete one, it's locked
              if (firstIncompleteIndex !== -1 && modIndex > firstIncompleteIndex) {
                isLocked = true;
              }
            }

            moduleName = mod.name;
            modName = mod.modname;
            moduleIndex = modIndex;
            isComplete = modComplete;
            bunnyVideoId = mod.bunnyVideoId ?? "";
            bunnyLibraryId = mod.bunnyLibraryId ?? "";
            if (mod.modname === "quiz") {
              quizId = mod.instance;
            }
            console.log(`[MODULE_PAGE] cmid=${mod.id} name="${mod.name}" modname="${mod.modname}" bunnyVideoId="${bunnyVideoId}" bunnyLibraryId="${bunnyLibraryId}"`);
            // Build a valid module URL:
            // 1. If Moodle provided a URL with an id= param, use it as-is
            // 2. If Moodle provided a URL WITHOUT id=, append ?id={cmid}
            // 3. If no URL at all, construct fallback: /mod/{modname}/view.php?id={cmid}
            const fallbackUrl = `${MOODLE_URL}/mod/${mod.modname}/view.php?id=${mod.id}`;
            if (mod.url && mod.url.includes("id=")) {
              moduleUrl = mod.url;
            } else if (mod.url) {
              // Moodle gave a URL but without id — append it
              const sep = mod.url.includes("?") ? "&" : "?";
              moduleUrl = `${mod.url}${sep}id=${mod.id}`;
            } else {
              moduleUrl = fallbackUrl;
            }
            if (modIndex + 1 < modules.length) {
              // Only show next module link if current module is completed
              if (modComplete) {
                nextModuleId = String(modules[modIndex + 1].id);
              }
            }
            // Previous module navigation removed — drivers should use the
            // course/learning page to navigate, and only to the current module.
          }
        }
      } catch (err) {
        console.error("[MODULE] Moodle fetch failed:", err);
        loadError = "Unable to load module data from Moodle. Please try again later.";
      }
    }
  }

  const hasData = moduleIndex >= 0 && (moduleUrl || bunnyVideoId || modName === "quiz");

  // If the module is locked, show a locked message instead of the content
  if (isLocked) {
    // Find the first incomplete module to redirect the driver to
    return (
      <div className="page-content">
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
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "1rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <Lock size={32} style={{ color: "#EF4444", margin: "0 auto 1rem" }} />
          <h1
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: 800,
              fontSize: "1.25rem",
              color: "#F9FAFB",
              margin: "0 0 0.5rem",
            }}
          >
            Module locked
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
            You need to complete the previous modules before you can access this one.
            Continue with your current module to unlock this content.
          </p>
          <Link
            href="/portal/course"
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
            Go to current module <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Back link */}
      <Link
        href="/portal/learning"
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
        {totalModules > 0 && moduleIndex >= 0 && (
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
        )}
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
          {moduleName || "Module"}
        </h1>
        {hasData && (
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
        )}
      </div>

      {/* Error state */}
      {loadError && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "1rem",
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.875rem",
          }}
        >
          <AlertCircle size={20} style={{ color: "#EF4444", flexShrink: 0, marginTop: "0.125rem" }} />
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "#F9FAFB",
                margin: "0 0 0.25rem",
              }}
            >
              Couldn&apos;t load module content
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>
              {loadError}
            </p>
          </div>
        </div>
      )}

      {/* Bunny Stream player — preferred when video data exists */}
      {bunnyVideoId && bunnyLibraryId && (
        <BunnyPlayer
          libraryId={bunnyLibraryId}
          videoId={bunnyVideoId}
          moduleId={id}
          moduleName={moduleName || "Module"}
        />
      )}

      {/* Native quiz player — when module is a Moodle quiz */}
      {modName === "quiz" && !bunnyVideoId && (
        <QuizPlayer moduleId={id} quizId={quizId} moduleName={moduleName || "Quiz"} />
      )}

      {/* Moodle iframe fallback — when no Bunny video or as secondary option */}
      {!bunnyVideoId && modName !== "quiz" && moduleUrl && (
        <MoodleIframe moduleUrl={moduleUrl} moduleName={moduleName || "Module"} />
      )}

      {/* Completion status — only when we successfully found the module */}
      {hasData && (
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
                color: isComplete ? "#10B981" : "#F59E0B",
                margin: "0 0 0.125rem",
              }}
            >
              {isComplete ? "Module completed" : "Module in progress"}
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
      )}

      {/* Navigation — only show next module if current is completed */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <Link
          href="/portal/course"
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
          ← Back to programme
        </Link>
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