import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import {
  generateMoodleAutoLoginUrl,
  isMoodleModuleComplete,
  mergeDriverProgress,
  moodleGetLearningSnapshot,
  MOODLE_URL,
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
    const [snapshot, watchedResult] = await Promise.all([
      moodleGetLearningSnapshot({
        moodleUserId: driver.moodle_user_id,
        programmeSlug: normalizeProgrammeSlug(enrolment.programme_slug ?? "professional-truck-driver"),
      }),
      supabaseAdmin
        .from("driver_module_progress")
        .select("module_id")
        .eq("driver_id", session.driverId),
    ]);
    const watchedIds = new Set((watchedResult.data ?? []).map((row) => String(row.module_id)));
    const module = snapshot.modules.find((candidate) => String(candidate.id) === moduleId);

    if (!module) {
      return NextResponse.json({ error: "Module not found in your programme" }, { status: 404 });
    }

    if (!isMoodleModuleComplete(module)) {
      // Moodle has not recorded this activity as complete for the driver yet.
      // Tracked activities need their view replayed in the driver's Moodle
      // session before the state can confirm; untracked activities have no
      // Moodle state at all, so BetterDriver keeps its own watched record.
      if (!module.completionTracked) {
        const { error: watchError } = await supabaseAdmin
          .from("driver_module_progress")
          .upsert(
            {
              driver_id: session.driverId,
              module_id: moduleId,
              percent_watched: 100,
              last_watched_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "driver_id,module_id" }
          );
        if (watchError) {
          console.error("[PROGRESS] Watched-state write failed:", watchError.message);
          return NextResponse.json({ error: "Could not save your learning progress" }, { status: 500 });
        }
        watchedIds.add(moduleId);
        const merged = mergeDriverProgress(snapshot.modules, watchedIds);
        await updateEnrolmentSummary(enrolment, merged);
        return NextResponse.json({ success: true, confirmed: false, untracked: true, progress: progressPayload(merged) });
      }

      let moodleUrl: string | undefined;
      try {
        const viewUrl = module.url ?? `${MOODLE_URL}/mod/${module.modname}/view.php?id=${module.id}`;
        moodleUrl = (await generateMoodleAutoLoginUrl({
          moodleUserId: driver.moodle_user_id,
          redirectUrl: viewUrl,
        })) ?? undefined;
      } catch (urlError) {
        console.error("[PROGRESS] Autologin URL generation failed:", urlError);
      }
      return NextResponse.json({
        success: true,
        confirmed: false,
        untracked: false,
        moodleUrl,
      });
    }

    // Confirmed by Moodle; keep the driver's watch record complete as well.
    await supabaseAdmin
      .from("driver_module_progress")
      .upsert(
        {
          driver_id: session.driverId,
          module_id: moduleId,
          percent_watched: 100,
          last_watched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "driver_id,module_id" }
      )
      .then(({ error: watchError }) => {
        if (watchError) console.error("[PROGRESS] Watched-state write failed:", watchError.message);
      });
    watchedIds.add(moduleId);

    const merged = mergeDriverProgress(snapshot.modules, watchedIds);
    const updateError = await updateEnrolmentSummary(enrolment, merged);
    if (updateError) {
      return NextResponse.json({ error: "Could not save your confirmed learning progress" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      confirmed: true,
      untracked: false,
      progress: progressPayload(merged),
    });
  } catch (error) {
    console.error("[PROGRESS] Moodle confirmation failed:", error);
    return NextResponse.json({ error: "Could not confirm your learning progress with Moodle" }, { status: 502 });
  }
}

function progressPayload(merged: ReturnType<typeof mergeDriverProgress>) {
  return {
    completedModules: merged.completedModules,
    totalModules: merged.totalModules,
    progressPercent: merged.progressPercent,
    completed: merged.allComplete,
  };
}

async function updateEnrolmentSummary(
  enrolment: { id: string; progress_percent: number | null; modules_completed: number | null; completed_at: string | null },
  merged: ReturnType<typeof mergeDriverProgress>
) {
  const justCompleted = merged.allComplete && !enrolment.completed_at;
  const changed =
    merged.progressPercent !== enrolment.progress_percent ||
    merged.completedModules !== enrolment.modules_completed ||
    justCompleted;
  if (!changed) return null;
  const { error } = await supabaseAdmin
    .from("enrolments")
    .update({
      progress_percent: merged.progressPercent,
      modules_completed: merged.completedModules,
      completed_at: justCompleted ? new Date().toISOString() : enrolment.completed_at,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", enrolment.id);
  if (error) {
    console.error("[PROGRESS] Enrolment summary update failed:", error.message);
    return error;
  }
  return null;
}
