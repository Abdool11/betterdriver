import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import {
  isMoodleModuleComplete,
  moodleGetLearningSnapshot,
  normalizeProgrammeSlug,
} from "@/lib/moodle";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/progress
 * Body: { moduleId: string }
 *
 * Compatibility endpoint for a completed Moodle quiz. BetterDriver never marks
 * a learner complete from browser input: it re-reads the driver-specific Moodle
 * activity state and stores only the aggregate learning summary.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { moduleId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const moduleId = typeof body.moduleId === "string" ? body.moduleId.trim() : "";
  if (!moduleId) {
    return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
  }

  const [{ data: driver, error: driverErr }, { data: enrolment, error: enrolmentErr }] = await Promise.all([
    supabaseAdmin
      .from("drivers")
      .select("id, moodle_user_id")
      .eq("id", session.driverId)
      .single(),
    supabaseAdmin
      .from("enrolments")
      .select("id, programme_slug, progress_percent, modules_completed, completed_at")
      .eq("driver_id", session.driverId)
      .in("status", ACTIVE_ENROLMENT_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  if (enrolmentErr) {
    console.error("[PROGRESS] Enrolment lookup failed:", enrolmentErr.message);
    return NextResponse.json({ error: "Could not verify your programme assignment" }, { status: 500 });
  }
  if (!enrolment) {
    return NextResponse.json({ error: "No active training programme is assigned to this driver profile" }, { status: 403 });
  }
  if (!driver.moodle_user_id) {
    return NextResponse.json({ error: "Your learning account has not been provisioned yet" }, { status: 409 });
  }

  try {
    const snapshot = await moodleGetLearningSnapshot({
      moodleUserId: driver.moodle_user_id,
      programmeSlug: normalizeProgrammeSlug(enrolment.programme_slug ?? "professional-truck-driver"),
    });
    const module = snapshot.modules.find((candidate) => String(candidate.id) === moduleId);

    if (!module) {
      return NextResponse.json({ error: "Module not found in your programme" }, { status: 404 });
    }
    if (!isMoodleModuleComplete(module)) {
      return NextResponse.json(
        { error: "Moodle has not confirmed completion for this module yet. Please complete it in the learning player." },
        { status: 409 }
      );
    }

    const justCompleted = snapshot.completed && !enrolment.completed_at;
    const changed =
      snapshot.progressPercent !== enrolment.progress_percent ||
      snapshot.completedModules !== enrolment.modules_completed ||
      justCompleted;

    if (changed) {
      const { error: updateError } = await supabaseAdmin
        .from("enrolments")
        .update({
          progress_percent: snapshot.progressPercent,
          modules_completed: snapshot.completedModules,
          completed_at: justCompleted ? new Date().toISOString() : enrolment.completed_at,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", enrolment.id);
      if (updateError) {
        console.error("[PROGRESS] Enrolment summary update failed:", updateError.message);
        return NextResponse.json({ error: "Could not save your confirmed learning progress" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      progress: {
        completedModules: snapshot.completedModules,
        totalModules: snapshot.totalModules,
        progressPercent: snapshot.progressPercent,
        completed: snapshot.completed,
      },
    });
  } catch (error) {
    console.error("[PROGRESS] Moodle confirmation failed:", error);
    return NextResponse.json({ error: "Could not confirm your learning progress with Moodle" }, { status: 502 });
  }
}
