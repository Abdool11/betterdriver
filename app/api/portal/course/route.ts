import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  moodleGetCourseModules,
  normalizeProgrammeSlug,
} from "@/lib/moodle";

/**
 * GET /api/portal/course
 * Returns the driver's programme modules from Moodle with completion states.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch driver + enrolment
  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, first_name, last_name, moodle_user_id")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const { data: enrolment, error: enrolmentErr } = await supabaseAdmin
    .from("enrolments")
    .select("programme_slug, status, progress_percent, modules_completed")
    .eq("driver_id", session.driverId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrolmentErr) {
    console.error("[COURSE] Enrolment fetch error:", enrolmentErr.message);
  }

  const programmeSlug = enrolment?.programme_slug ?? "ptdp";
  const canonicalSlug = normalizeProgrammeSlug(programmeSlug);

  const programmeTitle =
    canonicalSlug === "professional-truck-driver"
      ? "The Professional Truck Driver Programme"
      : "Eco-Driver Training";

  // 2. Fetch modules from Moodle
  let modules: Awaited<ReturnType<typeof moodleGetCourseModules>> = [];
  if (driver.moodle_user_id) {
    try {
      modules = await moodleGetCourseModules({
        moodleUserId: driver.moodle_user_id,
        programmeSlug: canonicalSlug,
      });
    } catch (err) {
      console.error("[COURSE] Moodle fetch failed:", err);
    }
  }

  // 3. Map Moodle completion states to UI statuses
  // 0 = incomplete, 1 = complete, 2 = complete (pass), 3 = complete (fail)
  // We derive "in-progress" / "available" / "locked" from sequential ordering
  let foundIncomplete = false;
  const mappedModules = modules.map((mod, index) => {
    const isComplete = mod.completionstate === 1 || mod.completionstate === 2;
    const isFail = mod.completionstate === 3;

    let status: "completed" | "in_progress" | "available" | "locked" = "locked";
    if (isComplete) {
      status = "completed";
    } else if (isFail) {
      status = "available"; // allow retry
    } else if (!foundIncomplete) {
      status = "in_progress";
      foundIncomplete = true;
    } else {
      status = "locked";
    }

    return {
      id: String(mod.id),
      name: mod.name,
      url: mod.url,
      completionstate: mod.completionstate,
      status,
      order: index + 1,
    };
  });

  const completedCount = mappedModules.filter((m) => m.status === "completed").length;
  const progressPercent = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  return NextResponse.json({
    programme: {
      slug: canonicalSlug,
      title: programmeTitle,
      progressPercent,
      totalModules: modules.length,
      completedModules: completedCount,
    },
    modules: mappedModules,
  });
}
