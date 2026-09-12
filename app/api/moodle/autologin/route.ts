import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import {
  generateMoodleAutoLoginUrl,
  moodleGetCourseModules,
  normalizeProgrammeSlug,
} from "@/lib/moodle";

/**
 * POST /api/moodle/autologin
 * Creates a five-minute Moodle handoff for one module that belongs to the
 * authenticated driver's active BetterDriver enrolment.
 *
 * Request: { moduleId: string }
 * Response: { url: string }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let moduleId = "";
  try {
    const body = (await req.json()) as { moduleId?: unknown };
    moduleId = typeof body.moduleId === "string" ? body.moduleId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!moduleId) {
    return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
  }

  const [{ data: driver, error: driverError }, { data: enrolment, error: enrolmentError }] = await Promise.all([
    supabaseAdmin
      .from("drivers")
      .select("id, moodle_user_id")
      .eq("id", session.driverId)
      .single(),
    supabaseAdmin
      .from("enrolments")
      .select("programme_slug, modules_completed")
      .eq("driver_id", session.driverId)
      .in("status", ACTIVE_ENROLMENT_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (driverError || !driver) {
    console.error("[MOODLE_AUTOLOGIN] Driver lookup failed:", driverError?.message);
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  if (enrolmentError) {
    console.error("[MOODLE_AUTOLOGIN] Enrolment lookup failed:", enrolmentError.message);
    return NextResponse.json({ error: "Could not verify your programme assignment" }, { status: 500 });
  }

  if (!enrolment) {
    return NextResponse.json({ error: "No active training programme is assigned to this driver profile" }, { status: 403 });
  }

  if (!driver.moodle_user_id) {
    return NextResponse.json({ error: "Your learning account has not been provisioned yet. Please contact support." }, { status: 409 });
  }

  try {
    const modules = await moodleGetCourseModules({
      moodleUserId: driver.moodle_user_id,
      programmeSlug: normalizeProgrammeSlug(enrolment.programme_slug ?? "professional-truck-driver"),
    });

    const moduleIndex = modules.findIndex((module) => String(module.id) === moduleId);
    const module = moduleIndex >= 0 ? modules[moduleIndex] : null;

    if (!module?.url) {
      return NextResponse.json({ error: "This learning module is not available for launch" }, { status: 404 });
    }

    const completedModules = enrolment.modules_completed ?? 0;
    const moduleCompleted = module.completionstate === 1 || module.completionstate === 2 || moduleIndex < completedModules;
    const previousIncomplete = modules.slice(0, moduleIndex).some((candidate, index) => {
      const completed = candidate.completionstate === 1 || candidate.completionstate === 2 || index < completedModules;
      return !completed;
    });

    if (!moduleCompleted && previousIncomplete) {
      return NextResponse.json({ error: "Complete the previous module before opening this one" }, { status: 403 });
    }

    const url = await generateMoodleAutoLoginUrl({
      moodleUserId: driver.moodle_user_id,
      redirectUrl: module.url,
    });

    if (!url) {
      return NextResponse.json({ error: "The secure learning handoff is not configured yet" }, { status: 503 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[MOODLE_AUTOLOGIN] Module launch failed:", error);
    return NextResponse.json({ error: "Your learning content could not be opened right now" }, { status: 502 });
  }
}
