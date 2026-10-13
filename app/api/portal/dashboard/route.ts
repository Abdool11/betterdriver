import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, first_name, last_name, email, mobile, language_preference, moodle_user_id, company_id")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const { data: enrolment, error: enrolmentErr } = await supabaseAdmin
    .from("enrolments")
    .select("id, programme_slug, progress_percent, modules_completed, completed_at")
    .eq("driver_id", session.driverId)
    .in("status", ACTIVE_ENROLMENT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrolmentErr) {
    console.error("[DASHBOARD] Enrolment fetch error:", enrolmentErr.message);
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
      console.error("[DASHBOARD] Moodle provisioning failed:", error);
    }
  }

  if (moodleUserId && enrolment) {
    try {
      await moodleEnrolUser({ moodleUserId, programmeSlug: canonicalSlug });
    } catch (error) {
      console.error("[DASHBOARD] Moodle enrolment check failed:", error);
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
      const { data: cpdRows } = await supabaseAdmin
        .from("driver_cpd_participation")
        .select("completed_at, cpd_modules(due_date)")
        .eq("driver_id", session.driverId);

      for (const row of cpdRows ?? []) {
        if (row.completed_at) continue;
        const module = row.cpd_modules as unknown as { due_date?: string } | null;
        const due = module?.due_date ? new Date(module.due_date) : null;
        if (!due) continue;
        if (due.toISOString() < now) overdue++;
        else if (due.toISOString() <= fourteenStr) upcoming++;
      }
    } catch (error) {
      console.error("[DASHBOARD] CPD stats fetch failed:", error);
    }
    return { overdue, upcoming };
  })();

  const bulletinsPromise = (async () => {
    let unread = 0;
    try {
      if (driver.company_id) {
        const { data: bulletinRows } = await supabaseAdmin
          .from("bulletins")
          .select("id")
          .eq("company_id", driver.company_id)
          .eq("status", "disseminated");
        const bulletinIds = (bulletinRows ?? []).map((row) => row.id);
        if (bulletinIds.length > 0) {
          const { data: readRows } = await supabaseAdmin
            .from("driver_bulletin_interactions")
            .select("bulletin_id")
            .eq("driver_id", session.driverId)
            .not("read_at", "is", null)
            .in("bulletin_id", bulletinIds);
          const readSet = new Set((readRows ?? []).map((row) => row.bulletin_id));
          unread = bulletinIds.filter((id) => !readSet.has(id)).length;
        }
      }
    } catch (error) {
      console.error("[DASHBOARD] Bulletins unread count failed:", error);
    }
    return unread;
  })();

  const learningPromise = (async () => {
    if (!moodleUserId || !enrolment) return null;
    try {
      return await moodleGetLearningSnapshot({ moodleUserId, programmeSlug: canonicalSlug });
    } catch (error) {
      console.error("[DASHBOARD] Moodle learning snapshot failed:", error);
      return null;
    }
  })();

  const [learningSnapshot, cpdResult, unreadBulletins] = await Promise.all([
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
      console.error("[DASHBOARD] Enrolment summary update failed:", updateError.message);
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
    stats: {
      firstName: driver.first_name ?? session.firstName,
      lastName: driver.last_name ?? session.lastName,
      programmeTitle,
      progressPercent,
      completedModules,
      totalModules,
      cpdDue: cpdResult.overdue > 0 || cpdResult.upcoming > 0,
      cpdOverdueCount: cpdResult.overdue,
      cpdUpcomingCount: cpdResult.upcoming,
      certificateReady: false,
      certificatePendingGfa: courseCompleted,
      unreadBulletins,
      learningStatus: learningSnapshot ? "available" : (enrolment ? "unavailable" : "not_assigned"),
    },
    nextModule: nextModule
      ? { id: String(nextModule.id), name: nextModule.name, url: nextModule.url }
      : null,
    moodleUserId,
  });
}
