import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import {
  isMoodleModuleComplete,
  isMoodleModuleLocked,
  moodleGetLearningSnapshot,
  normalizeProgrammeSlug,
  pickMoodleDownloadFile,
} from "@/lib/moodle";

/**
 * GET /api/portal/course
 * Returns the assigned programme with driver-specific Moodle activity states.
 * Completion and locking are derived only from the Moodle activity-status API;
 * an aggregate BetterDriver count is never converted into module completion.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, moodle_user_id")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const { data: enrolment, error: enrolmentErr } = await supabaseAdmin
    .from("enrolments")
    .select("programme_slug, status")
    .eq("driver_id", session.driverId)
    .in("status", ACTIVE_ENROLMENT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrolmentErr) {
    console.error("[COURSE] Enrolment fetch error:", enrolmentErr.message);
    return NextResponse.json({ error: "Could not load your training assignment" }, { status: 500 });
  }

  const programmeSlug = enrolment?.programme_slug ?? "ptdp";
  const canonicalSlug = normalizeProgrammeSlug(programmeSlug);
  const programmeTitle =
    canonicalSlug === "professional-truck-driver"
      ? "The Professional Truck Driver Programme"
      : "Eco-Driver Training";

  if (!enrolment) {
    return NextResponse.json({
      programme: {
        slug: canonicalSlug,
        title: programmeTitle,
        progressPercent: 0,
        totalModules: 0,
        completedModules: 0,
      },
      modules: [],
    });
  }

  if (!driver.moodle_user_id) {
    return NextResponse.json(
      { error: "Your learning account is still being prepared. Please try again shortly." },
      { status: 409 }
    );
  }

  try {
    const snapshot = await moodleGetLearningSnapshot({
      moodleUserId: driver.moodle_user_id,
      programmeSlug: canonicalSlug,
    });

    const mappedModules = snapshot.modules.map((module, index) => {
      const completed = isMoodleModuleComplete(module);
      const locked = !completed && isMoodleModuleLocked(snapshot.modules, index);
      const status = completed
        ? "completed"
        : locked || !module.completionTracked
          ? "available"
          : "in_progress";
      const downloadFile = pickMoodleDownloadFile(module.files);
      const hasBunnyVideo = Boolean(module.bunnyVideoId);

      return {
        id: String(module.id),
        name: module.name,
        url: module.url,
        completionstate: module.completionstate,
        status,
        locked,
        order: index + 1,
        downloadable: Boolean(downloadFile) || hasBunnyVideo,
        downloadSize: downloadFile?.filesize,
        downloadFilename:
          downloadFile?.filename ??
          (hasBunnyVideo ? `${module.name.replace(/[^a-zA-Z0-9\s]/g, "").trim()}.mp4` : undefined),
      };
    });

    return NextResponse.json({
      programme: {
        slug: canonicalSlug,
        title: programmeTitle,
        progressPercent: snapshot.progressPercent,
        totalModules: snapshot.totalModules,
        completedModules: snapshot.completedModules,
      },
      modules: mappedModules,
    });
  } catch (error) {
    console.error("[COURSE] Moodle learning snapshot failed:", error);
    return NextResponse.json(
      { error: "Your current learning progress could not be confirmed. Please try again shortly." },
      { status: 502 }
    );
  }
}
