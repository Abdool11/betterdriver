import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  moodleGetProgress,
  moodleGetCourseModules,
  moodleCreateUser,
  moodleEnrolUser,
  moodleGetUserByEmail,
  normalizeProgrammeSlug,
} from "@/lib/moodle";

/**
 * GET /api/portal/dashboard
 * Returns the driver's dashboard stats by combining Supabase enrolment data
 * with live Moodle progress.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch driver + active enrolment from Supabase
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
    .select("id, programme_slug, status, progress_percent, modules_completed, completed_at, cpd_completions")
    .eq("driver_id", session.driverId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrolmentErr) {
    console.error("[DASHBOARD] Enrolment fetch error:", enrolmentErr.message);
  }

  const programmeSlug = enrolment?.programme_slug ?? "ptdp";
  const canonicalSlug = normalizeProgrammeSlug(programmeSlug);

  // 2. Lazy Moodle provisioning — create user / enrol if missing
  let moodleUserId = driver.moodle_user_id ?? null;
  if (!moodleUserId && driver.email) {
    try {
      const existing = await moodleGetUserByEmail(driver.email);
      if (existing) {
        moodleUserId = existing.id;
        await supabaseAdmin
          .from("drivers")
          .update({ moodle_user_id: existing.id })
          .eq("id", driver.id);
      } else {
        // Generate a secure random password for Moodle
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
        await supabaseAdmin
          .from("drivers")
          .update({ moodle_user_id: newUser.id })
          .eq("id", driver.id);
      }
    } catch (err) {
      console.error("[DASHBOARD] Moodle provisioning failed:", err);
    }
  }

  // 3. Enrol in course if not yet enrolled
  if (moodleUserId && enrolment?.status === "active") {
    try {
      await moodleEnrolUser({ moodleUserId, programmeSlug: canonicalSlug });
    } catch {
      // enrolment may already exist — safe to ignore
    }
  }

  // 4. Fetch live progress from Moodle
  let progress = {
    completed: false,
    completiongrade: null as number | null,
    completedmodules: 0,
    totalmodules: 0,
    progressPercent: 0,
  };
  let moodleModules: Awaited<ReturnType<typeof moodleGetCourseModules>> = [];

  if (moodleUserId) {
    try {
      progress = await moodleGetProgress({
        moodleUserId,
        programmeSlug: canonicalSlug,
      });
      moodleModules = await moodleGetCourseModules({
        moodleUserId,
        programmeSlug: canonicalSlug,
      });
    } catch (err) {
      console.error("[DASHBOARD] Moodle fetch failed:", err);
    }
  }

  // 5. Sync progress back to Supabase if it changed
  if (enrolment && (progress.progressPercent !== enrolment.progress_percent || progress.completedmodules !== enrolment.modules_completed)) {
    await supabaseAdmin
      .from("enrolments")
      .update({
        progress_percent: progress.progressPercent,
        modules_completed: progress.completedmodules,
        completed_at: progress.completed && !enrolment.completed_at ? new Date().toISOString() : enrolment.completed_at,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", enrolment.id);
  }

  // 6. Determine next module (first incomplete module in order)
  const nextModule = moodleModules.find((m) => m.completionstate === 0) ?? null;

  // 7. Build dashboard response
  const programmeTitle =
    canonicalSlug === "professional-truck-driver"
      ? "The Professional Truck Driver Programme"
      : "Eco-Driver Training";

  return NextResponse.json({
    stats: {
      firstName: driver.first_name ?? session.firstName,
      lastName: driver.last_name ?? session.lastName,
      programmeTitle,
      progressPercent: progress.progressPercent,
      completedModules: progress.completedmodules,
      totalModules: progress.totalmodules,
      cpdDue: false, // TODO: wire CPD once table is ready
      certificateReady: progress.completed,
      unreadBulletins: 0, // TODO: wire bulletins
    },
    nextModule: nextModule
      ? {
          id: String(nextModule.id),
          name: nextModule.name,
          url: nextModule.url,
        }
      : null,
    moodleUserId,
  });
}
