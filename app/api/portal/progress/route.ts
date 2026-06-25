import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import {
  moodleGetCourseModules,
  normalizeProgrammeSlug,
  MOODLE_URL,
  generateMoodleAutoLoginUrl,
  moodleUpdateModuleCompletion,
} from "@/lib/moodle";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/progress
 * Body: { moduleId: string, completed: boolean }
 *
 * 1. Marks the module complete in BD's database
 * 2. Simulates a Moodle page view to trigger native completion tracking
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { moduleId?: string; completed?: boolean; percentWatched?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { moduleId, completed, percentWatched } = body;
  if (!moduleId || typeof completed !== "boolean") {
    return NextResponse.json(
      { error: "moduleId and completed are required" },
      { status: 400 }
    );
  }

  // Fetch driver + enrolment
  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, moodle_user_id")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const { data: enrolment } = await supabaseAdmin
    .from("enrolments")
    .select("programme_slug, status")
    .eq("driver_id", session.driverId)
    .in("status", ACTIVE_ENROLMENT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const programmeSlug = enrolment?.programme_slug ?? "ptdp";
  const canonicalSlug = normalizeProgrammeSlug(programmeSlug);

  // Find the module in Moodle
  let moduleUrl = "";
  let foundModule = false;
  let modules: Awaited<ReturnType<typeof moodleGetCourseModules>> = [];
  try {
    modules = await moodleGetCourseModules({
      moodleUserId: driver.moodle_user_id ?? 0,
      programmeSlug: canonicalSlug,
    });
    const mod = modules.find((m) => String(m.id) === moduleId);
    if (mod) {
      foundModule = true;
      const fallbackUrl = `${MOODLE_URL}/mod/${mod.modname}/view.php?id=${mod.id}`;
      if (mod.url && mod.url.includes("id=")) {
        moduleUrl = mod.url;
      } else if (mod.url) {
        const sep = mod.url.includes("?") ? "&" : "?";
        moduleUrl = `${mod.url}${sep}id=${mod.id}`;
      } else {
        moduleUrl = fallbackUrl;
      }
    }
  } catch (err) {
    console.error("[PROGRESS] Moodle fetch failed:", err);
  }

  // Update BD enrolment progress
  try {
    const { data: currentEnrolment } = await supabaseAdmin
      .from("enrolments")
      .select("id, modules_completed, progress_percent")
      .eq("driver_id", session.driverId)
      .in("status", ACTIVE_ENROLMENT_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentEnrolment && completed) {
      const moduleIndex = modules.findIndex((m) => String(m.id) === moduleId);
      const alreadyCounted =
        moduleIndex >= 0 && moduleIndex < (currentEnrolment.modules_completed ?? 0);
      if (!alreadyCounted) {
        const newCompleted = Math.max(
          currentEnrolment.modules_completed ?? 0,
          (currentEnrolment.modules_completed ?? 0) + 1
        );
        // We can't easily know total from here, so just increment if not already counted
        await supabaseAdmin
          .from("enrolments")
          .update({
            modules_completed: newCompleted,
            progress_percent: currentEnrolment.progress_percent, // will recalc on next dashboard load
            status: "in_progress",
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEnrolment.id);
      }
    }
  } catch (err) {
    console.error("[PROGRESS] Failed to update enrolment:", err);
  }

  // Upsert partial progress (percent watched) so the course listing can show it
  if (typeof percentWatched === "number" && percentWatched >= 0 && percentWatched <= 100) {
    try {
      await supabaseAdmin
        .from("driver_module_progress")
        .upsert(
          {
            driver_id: session.driverId,
            module_id: moduleId,
            percent_watched: Math.round(percentWatched),
            last_watched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "driver_id,module_id" }
        );
    } catch (err) {
      console.error("[PROGRESS] Failed to upsert module progress:", err);
    }
  }

  // Push completion back to Moodle so badge/certificate rules fire there
  if (completed && driver.moodle_user_id) {
    try {
      await moodleUpdateModuleCompletion({
        moodleUserId: driver.moodle_user_id,
        cmid: parseInt(moduleId, 10),
        completed: true,
      });
    } catch (err) {
      console.error("[PROGRESS] Failed to update Moodle completion:", err);
    }
  }

  // Generate a signed autologin URL so the CLIENT can trigger Moodle's
  // native completion tracking (server-side fetches lack user cookies).
  let moodleAutoLoginUrl: string | null = null;
  if (foundModule && moduleUrl && driver.moodle_user_id) {
    try {
      moodleAutoLoginUrl = await generateMoodleAutoLoginUrl({
        moodleUserId: driver.moodle_user_id,
        redirectUrl: moduleUrl,
      });
    } catch (err) {
      console.error("[PROGRESS] Failed to generate autologin URL:", err);
    }
  }

  return NextResponse.json({ success: true, moodleUrl: moodleAutoLoginUrl });
}
