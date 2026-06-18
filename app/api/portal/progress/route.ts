import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  moodleGetCourseModules,
  normalizeProgrammeSlug,
  MOODLE_URL,
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

  let body: { moduleId?: string; completed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { moduleId, completed } = body;
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
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const programmeSlug = enrolment?.programme_slug ?? "ptdp";
  const canonicalSlug = normalizeProgrammeSlug(programmeSlug);

  // Find the module in Moodle
  let moduleUrl = "";
  let foundModule = false;
  try {
    const modules = await moodleGetCourseModules({
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
      .select("modules_completed, progress_percent")
      .eq("driver_id", session.driverId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentEnrolment && completed) {
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
          updated_at: new Date().toISOString(),
        })
        .eq("driver_id", session.driverId)
        .eq("status", "active");
    }
  } catch (err) {
    console.error("[PROGRESS] Failed to update enrolment:", err);
  }

  // Trigger Moodle completion by simulating a page view
  if (foundModule && moduleUrl) {
    try {
      // Fire-and-forget: visit the page server-side
      await fetch(moduleUrl, { method: "HEAD", redirect: "follow" });
    } catch (err) {
      console.error("[PROGRESS] Moodle view simulation failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}
