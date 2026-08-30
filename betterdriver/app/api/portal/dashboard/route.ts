import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import {
  moodleGetProgress,
  moodleGetCourseModules,
  moodleCreateUser,
  moodleEnrolUser,
  moodleGetUserByEmail,
  normalizeProgrammeSlug,
} from "@/lib/moodle";
import { ensureCertificate } from "@/lib/certificate";

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
    .in("status", ACTIVE_ENROLMENT_STATUSES)
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
  if (moodleUserId && enrolment) {
    try {
      await moodleEnrolUser({ moodleUserId, programmeSlug: canonicalSlug });
    } catch {
      // enrolment may already exist — safe to ignore
    }
  }

  // 4. Fetch live progress from Moodle + CPD stats + bulletins in parallel
  let progress = {
    completed: false,
    completiongrade: null as number | null,
    completedmodules: 0,
    totalmodules: 0,
    progressPercent: 0,
  };
  let moodleModules: Awaited<ReturnType<typeof moodleGetCourseModules>> = [];

  // CPD stats query (independent of Moodle)
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
        const mod = row.cpd_modules as unknown as { due_date?: string } | null;
        const due = mod?.due_date ? new Date(mod.due_date) : null;
        if (due) {
          if (due.toISOString() < now) {
            overdue++;
          } else if (due.toISOString() <= fourteenStr) {
            upcoming++;
          }
        }
      }
    } catch (err) {
      console.error("[DASHBOARD] CPD stats fetch failed:", err);
    }
    return { overdue, upcoming };
  })();

  // Bulletins query (independent of Moodle)
  const bulletinsPromise = (async () => {
    let unread = 0;
    try {
      if (driver.company_id) {
        const { data: bRows } = await supabaseAdmin
          .from("bulletins")
          .select("id")
          .eq("company_id", driver.company_id)
          .eq("status", "disseminated");
        const bIds = (bRows ?? []).map((r) => r.id);
        if (bIds.length > 0) {
          const { data: readR } = await supabaseAdmin
            .from("driver_bulletin_interactions")
            .select("bulletin_id")
            .eq("driver_id", session.driverId)
            .not("read_at", "is", null)
            .in("bulletin_id", bIds);
          const readSet = new Set((readR ?? []).map((r) => r.bulletin_id));
          unread = bIds.filter((id) => !readSet.has(id)).length;
        }
      }
    } catch (err) {
      console.error("[DASHBOARD] Bulletins unread count failed:", err);
    }
    return unread;
  })();

  // Moodle progress + modules in parallel with CPD + bulletins
  const moodlePromise = (async () => {
    if (!moodleUserId) return { progress, moodleModules };
    try {
      const [progressResult, modulesResult] = await Promise.all([
        moodleGetProgress({ moodleUserId, programmeSlug: canonicalSlug }),
        moodleGetCourseModules({ moodleUserId, programmeSlug: canonicalSlug }),
      ]);
      return { progress: progressResult, moodleModules: modulesResult };
    } catch (err) {
      console.error("[DASHBOARD] Moodle fetch failed:", err);
      return { progress, moodleModules };
    }
  })();

  const [{ progress: moodleProgress, moodleModules: moodleMods }, cpdResult, unreadBulletins] =
    await Promise.all([moodlePromise, cpdPromise, bulletinsPromise]);

  progress = moodleProgress;
  moodleModules = moodleMods;
  const cpdOverdueCount = cpdResult.overdue;
  const cpdUpcomingCount = cpdResult.upcoming;

  // 5. Use the most up-to-date completed count. The progress API updates
  // Supabase immediately when a video finishes, while Moodle may lag.
  const supabaseCompleted = enrolment?.modules_completed ?? 0;
  const completedModules = Math.max(progress.completedmodules, supabaseCompleted);
  const totalModules = moodleModules.length > 0 ? moodleModules.length : progress.totalmodules;
  const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const courseCompleted = completedModules >= totalModules && totalModules > 0;

  // 6. Sync the latest progress back to Supabase
  const justCompleted = courseCompleted && !enrolment?.completed_at;
  if (enrolment && (progressPercent !== enrolment.progress_percent || completedModules !== enrolment.modules_completed || courseCompleted !== !!enrolment.completed_at)) {
    await supabaseAdmin
      .from("enrolments")
      .update({
        progress_percent: progressPercent,
        modules_completed: completedModules,
        completed_at: justCompleted ? new Date().toISOString() : enrolment.completed_at,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", enrolment.id);
  }

  // 6b. Auto-create certificate when the course is first detected as complete
  let certificateNumber: string | null = null;
  let certificateIssuedAt: string | null = null;
  if (courseCompleted && enrolment) {
    const cert = await ensureCertificate({
      driverId: session.driverId,
      enrolmentId: enrolment.id,
      companyId: driver.company_id ?? null,
      programme: canonicalSlug === "professional-truck-driver" ? "p1" : "p2",
      enrolmentSlug: canonicalSlug,
    });
    if (cert) {
      certificateNumber = cert.certificate_number;
      certificateIssuedAt = cert.issued_at;
    } else {
      console.error("[DASHBOARD] ensureCertificate returned null for driver", session.driverId);
    }
  }

  // 7. Determine next module (first incomplete module in order)
  const nextModule = moodleModules.find((m) => m.completionstate === 0) ?? null;

  // 8. Build dashboard response
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
      cpdDue: cpdOverdueCount > 0 || cpdUpcomingCount > 0,
      cpdOverdueCount,
      cpdUpcomingCount,
      certificateReady: courseCompleted,
      certificateNumber,
      certificateIssuedAt,
      unreadBulletins,
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
