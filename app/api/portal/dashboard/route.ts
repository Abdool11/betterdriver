import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import { learningDbRead } from "@/lib/learning-db-read";
import { learningDiagnostic, learningFailure, learningRequestId, LEARNING_READ_VERSION } from "@/lib/learning-response";
import {
  isMoodleModuleComplete,
  isMoodleModuleLocked,
  moodleCreateUser,
  moodleEnrolUser,
  moodleGetLearningSnapshot,
  moodleGetUserByEmail,
  normalizeProgrammeSlug,
} from "@/lib/moodle";

/**
 * GET /api/portal/dashboard
 * Returns dashboard information for the authenticated driver. Course totals,
 * next module and certificate-pending state all use one driver-specific Moodle
 * activity snapshot so they agree with My Course and My Progress.
 */
export async function GET(_req: NextRequest) {
  const requestId = learningRequestId();
  let stage = "session";
  try {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  stage = "driver_lookup";
  const { data: driver, error: driverErr } = await learningDbRead((signal) => supabaseAdmin
    .from("drivers")
    .select("id, first_name, last_name, email, mobile, language_preference, moodle_user_id, company_id")
    .eq("id", session.driverId)
    .abortSignal(signal).single());

  if (driverErr || !driver) {
    const absent = !driverErr || driverErr.code === "PGRST116";
    return learningFailure(driverErr, stage, requestId, absent ? 404 : 503, absent ? "DRIVER_NOT_FOUND" : "DRIVER_LOOKUP");
  }

  stage = "assignment_lookup";
  const { data: enrolment, error: enrolmentErr } = await learningDbRead((signal) => supabaseAdmin
    .from("enrolments")
    .select("id, programme_slug, progress_percent, modules_completed, completed_at")
    .eq("driver_id", session.driverId)
    .in("status", ACTIVE_ENROLMENT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .abortSignal(signal).maybeSingle());

  if (enrolmentErr) {
    return learningFailure(enrolmentErr, stage, requestId, 503, "ASSIGNMENT_LOOKUP");
  }

  const programmeSlug = enrolment?.programme_slug ?? "ptdp";
  const canonicalSlug = normalizeProgrammeSlug(programmeSlug);

  // Lazy Moodle provisioning remains scoped to the signed-in BetterDriver driver.
  let moodleUserId = driver.moodle_user_id ?? null;
  if (!moodleUserId && driver.email) {
    try {
      const existing = await moodleGetUserByEmail(driver.email);
      if (existing) {
        moodleUserId = existing.id;
        await supabaseAdmin.from("drivers").update({ moodle_user_id: existing.id }).eq("id", driver.id);
      } else {
        const password = `Bd${Math.random().toString(36).slice(2)}${Date.now()}!`;
        const cleanEmail = driver.email.toLowerCase().replace(/[^a-z0-9]/g, "");
        const username = cleanEmail.slice(0, 20) + Date.now().toString().slice(-6);
        const newUser = await moodleCreateUser({
          username,
          password,
          firstname: driver.first_name ?? "Driver",
          lastname: driver.last_name ?? "",
          email: driver.email,
        });
        moodleUserId = newUser.id;
        await supabaseAdmin.from("drivers").update({ moodle_user_id: newUser.id }).eq("id", driver.id);
      }
    } catch (error) {
      learningDiagnostic(error, "provisioning", requestId);
    }
  }

  if (moodleUserId && enrolment) {
    try {
      await moodleEnrolUser({ moodleUserId, programmeSlug: canonicalSlug });
    } catch (error) {
      learningDiagnostic(error, "enrolment_check", requestId);
    }
  }

  const cpdPromise = (async () => {
    let overdue = 0;
    let upcoming = 0;
    try {
      const now = new Date().toISOString();
      const fourteenDays = new Date();
      fourteenDays.setDate(fourteenDays.getDate() + 14);
      const fourteenStr = fourteenDays.toISOString();
      const { data: cpdRows, error: cpdError } = await learningDbRead((signal) => supabaseAdmin
        .from("driver_cpd_participation")
        .select("completed_at, cpd_modules(due_date)")
        .eq("driver_id", session.driverId).abortSignal(signal));

      if (cpdError) throw cpdError;
      for (const row of cpdRows ?? []) {
        if (row.completed_at) continue;
        const module = row.cpd_modules as unknown as { due_date?: string } | null;
        const due = module?.due_date ? new Date(module.due_date) : null;
        if (!due) continue;
        if (due.toISOString() < now) overdue++;
        else if (due.toISOString() <= fourteenStr) upcoming++;
      }
    } catch (error) {
      learningDiagnostic(error, "cpd_read", requestId);
      return { overdue: null, upcoming: null, available: false };
    }
    return { overdue, upcoming, available: true };
  })();

  const bulletinsPromise = (async () => {
    let unread = 0;
    try {
      if (driver.company_id) {
        const { data: bulletinRows, error: bulletinError } = await learningDbRead((signal) => supabaseAdmin
          .from("bulletins")
          .select("id")
          .eq("company_id", driver.company_id)
          .eq("status", "disseminated").abortSignal(signal));
        if (bulletinError) throw bulletinError;
        const bulletinIds = (bulletinRows ?? []).map((row) => row.id);
        if (bulletinIds.length > 0) {
          const { data: readRows, error: readError } = await learningDbRead((signal) => supabaseAdmin
            .from("driver_bulletin_interactions")
            .select("bulletin_id")
            .eq("driver_id", session.driverId)
            .not("read_at", "is", null)
            .in("bulletin_id", bulletinIds).abortSignal(signal));
          if (readError) throw readError;
          const readSet = new Set((readRows ?? []).map((row) => row.bulletin_id));
          unread = bulletinIds.filter((id) => !readSet.has(id)).length;
        }
      }
    } catch (error) {
      learningDiagnostic(error, "bulletin_read", requestId);
      return { unread: null, available: false };
    }
    return { unread, available: true };
  })();

  let learningError: { code: string; requestId: string; version: string } | null = null;
  const learningPromise = (async () => {
    if (!enrolment) return null;
    if (!moodleUserId) { learningError = learningDiagnostic(null, "learning_account", requestId, "LEARNING_ACCOUNT_PENDING"); return null; }
    try {
      const snapshot = await moodleGetLearningSnapshot({ moodleUserId, programmeSlug: canonicalSlug });
      if (snapshot.modules.length === 0) { learningError = learningDiagnostic(null, "course_contents", requestId, "COURSE_EMPTY"); return null; }
      return snapshot;
    } catch (error) {
      learningError = learningDiagnostic(error, "moodle_snapshot", requestId);
      return null;
    }
  })();

  const [learningSnapshot, cpdResult, bulletinResult] = await Promise.all([
    learningPromise,
    cpdPromise,
    bulletinsPromise,
  ]);

  const completedModules = learningSnapshot?.completedModules ?? 0;
  const totalModules = learningSnapshot?.totalModules ?? 0;
  const progressPercent = learningSnapshot?.progressPercent ?? 0;
  const courseCompleted = learningSnapshot?.completed ?? false;
  const justCompleted = courseCompleted && !enrolment?.completed_at;

  if (
    enrolment &&
    learningSnapshot &&
    (progressPercent !== enrolment.progress_percent ||
      completedModules !== enrolment.modules_completed ||
      justCompleted)
  ) {
    const { error: updateError } = await supabaseAdmin
      .from("enrolments")
      .update({
        progress_percent: progressPercent,
        modules_completed: completedModules,
        completed_at: justCompleted ? new Date().toISOString() : enrolment.completed_at,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", enrolment.id);
    if (updateError) {
      learningDiagnostic(updateError, "summary_update", requestId);
    }
  }

  const nextModule = learningSnapshot?.modules.find(
    (module, index, modules) => !isMoodleModuleComplete(module) && !isMoodleModuleLocked(modules, index)
  ) ?? null;
  const programmeTitle =
    canonicalSlug === "professional-truck-driver"
      ? "The Professional Truck Driver Programme"
      : "Eco-Driver Training";

  return NextResponse.json({
    version: LEARNING_READ_VERSION,
    stats: {
      firstName: driver.first_name ?? session.firstName,
      lastName: driver.last_name ?? session.lastName,
      programmeTitle,
      progressPercent: enrolment && !learningSnapshot ? null : progressPercent,
      completedModules: enrolment && !learningSnapshot ? null : completedModules,
      totalModules: enrolment && !learningSnapshot ? null : totalModules,
      cpdDue: cpdResult.available ? (cpdResult.overdue ?? 0) > 0 || (cpdResult.upcoming ?? 0) > 0 : null,
      cpdStatus: cpdResult.available ? "available" : "unavailable",
      bulletinStatus: bulletinResult.available ? "available" : "unavailable",
      cpdOverdueCount: cpdResult.overdue,
      cpdUpcomingCount: cpdResult.upcoming,
      certificateReady: false,
      certificatePendingGfa: courseCompleted,
      unreadBulletins: bulletinResult.unread,
      learningError,
      learningStatus: learningSnapshot ? "available" : (enrolment ? "unavailable" : "not_assigned"),
    },
    nextModule: nextModule
      ? { id: String(nextModule.id), name: nextModule.name, url: nextModule.url }
      : null,
    moodleUserId,
  }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return learningFailure(error, stage, requestId, 503, stage === "driver_lookup" ? "DRIVER_LOOKUP" : stage === "assignment_lookup" ? "ASSIGNMENT_LOOKUP" : "LEARNING_UNAVAILABLE");
  }
}
