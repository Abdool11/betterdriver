import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import { learningDbRead } from "@/lib/learning-db-read";
import { getMoodleModuleDisplayState, moodleGetLearningSnapshot, normalizeProgrammeSlug, pickMoodleDownloadFile } from "@/lib/moodle";
import { LEARNING_READ_VERSION, learningFailure, learningRequestId } from "@/lib/learning-response";

/** Read-only bd-learning-read.v1: same auth/driver assignment, safe correlated errors. */
export async function GET() {
  const requestId = learningRequestId();
  let stage = "session";
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    stage = "driver_lookup";
    const { data: driver, error: driverErr } = await learningDbRead((signal) => supabaseAdmin.from("drivers").select("id, moodle_user_id").eq("id", session.driverId).abortSignal(signal).single());
    if (driverErr || !driver) {
      const absent = !driverErr || driverErr.code === "PGRST116";
      return learningFailure(driverErr, stage, requestId, absent ? 404 : 503, absent ? "DRIVER_NOT_FOUND" : "DRIVER_LOOKUP");
    }
    stage = "assignment_lookup";
    const { data: enrolment, error: enrolmentErr } = await learningDbRead((signal) => supabaseAdmin.from("enrolments").select("programme_slug, status").eq("driver_id", session.driverId).in("status", ACTIVE_ENROLMENT_STATUSES).order("created_at", { ascending: false }).limit(1).abortSignal(signal).maybeSingle());
    if (enrolmentErr) return learningFailure(enrolmentErr, stage, requestId, 503, "ASSIGNMENT_LOOKUP");
    const canonicalSlug = normalizeProgrammeSlug(enrolment?.programme_slug ?? "ptdp");
    const programmeTitle = canonicalSlug === "professional-truck-driver" ? "The Professional Truck Driver Programme" : "Eco-Driver Training";
    if (!enrolment) return NextResponse.json({ version: LEARNING_READ_VERSION, learningStatus: "not_assigned", programme: { slug: canonicalSlug, title: programmeTitle, progressPercent: 0, totalModules: 0, completedModules: 0 }, modules: [] }, { headers: { "Cache-Control": "private, no-store" } });
    if (!driver.moodle_user_id) return learningFailure(null, "learning_account", requestId, 409, "LEARNING_ACCOUNT_PENDING");
    stage = "moodle_snapshot";
    const snapshot = await moodleGetLearningSnapshot({ moodleUserId: driver.moodle_user_id, programmeSlug: canonicalSlug });
    if (snapshot.modules.length === 0) return learningFailure(null, "course_contents", requestId, 502, "COURSE_EMPTY");
    const mappedModules = snapshot.modules.map((module, index) => {
      const status = getMoodleModuleDisplayState(module, snapshot.modules, index);
      const downloadFile = pickMoodleDownloadFile(module.files);
      const hasBunnyVideo = Boolean(module.bunnyVideoId);
      return {
        id: String(module.id), name: module.name, url: module.url, completionstate: module.completionstate,
        status, locked: status === "locked", order: index + 1,
        downloadable: Boolean(downloadFile) || hasBunnyVideo, downloadSize: downloadFile?.filesize,
        downloadFilename: downloadFile?.filename ?? (hasBunnyVideo ? `${module.name.replace(/[^a-zA-Z0-9\s]/g, "").trim()}.mp4` : undefined),
      };
    });
    return NextResponse.json({
      version: LEARNING_READ_VERSION, learningStatus: "available",
      programme: { slug: canonicalSlug, title: programmeTitle, progressPercent: snapshot.progressPercent, totalModules: snapshot.totalModules, completedModules: snapshot.completedModules },
      modules: mappedModules,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return learningFailure(error, stage, requestId, stage === "moodle_snapshot" ? 502 : 503, stage === "driver_lookup" ? "DRIVER_LOOKUP" : stage === "assignment_lookup" ? "ASSIGNMENT_LOOKUP" : "LEARNING_UNAVAILABLE");
  }
}
