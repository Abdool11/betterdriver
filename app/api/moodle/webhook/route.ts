import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import { MOODLE_COURSE_IDS, moodleGetLearningSnapshot } from "@/lib/moodle";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dummy"
  );

const WEBHOOK_SECRET = process.env.MOODLE_WEBHOOK_SECRET ?? "";

const COURSE_ID_TO_SLUG: Record<number, "professional-truck-driver" | "eco-driver"> = {
  [parseInt(process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID ?? "0", 10)]: "professional-truck-driver",
  [parseInt(process.env.MOODLE_ECO_DRIVER_COURSE_ID ?? "0", 10)]: "eco-driver",
};

function validCompletionState(value: unknown): value is 0 | 1 | 2 | 3 {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/**
 * POST /api/moodle/webhook
 * Receives authenticated Moodle activity-completion events. The event is first
 * recorded with a deterministic key, then BetterDriver re-reads the complete
 * driver-specific Moodle snapshot. Browser input never controls completion.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("x-moodle-secret") ?? req.headers.get("authorization") ?? "";
  const secret = authHeader.replace("Bearer ", "").trim();
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    console.warn("[MOODLE_WEBHOOK] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    event?: unknown;
    userid?: unknown;
    courseid?: unknown;
    contextinstanceid?: unknown;
    completionstate?: unknown;
    timecreated?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const moodleUserId = typeof payload.userid === "number" ? payload.userid : null;
  const courseId = typeof payload.courseid === "number" ? payload.courseid : null;
  const moduleCmid = typeof payload.contextinstanceid === "number" ? payload.contextinstanceid : null;
  const eventType = typeof payload.event === "string" ? payload.event : "";
  const completionState = payload.completionstate;
  const timeCreated = typeof payload.timecreated === "number" ? payload.timecreated : null;

  if (!moodleUserId || !courseId || !moduleCmid || !eventType || !validCompletionState(completionState)) {
    return NextResponse.json({ error: "Invalid Moodle completion event" }, { status: 400 });
  }

  const programmeSlug = COURSE_ID_TO_SLUG[courseId];
  if (!programmeSlug || !Object.values(MOODLE_COURSE_IDS).includes(courseId)) {
    return NextResponse.json({ ok: true, skipped: "untracked course" });
  }

  const eventKey = `${eventType}:${moodleUserId}:${courseId}:${moduleCmid}:${completionState}:${timeCreated ?? "unknown"}`;
  const supabase = getSupabase();
  const { data: logEntry, error: logError } = await supabase
    .from("moodle_webhook_log")
    .insert({
      moodle_user_id: moodleUserId,
      course_id: courseId,
      module_cmid: moduleCmid,
      event_type: eventType,
      completion_state: completionState,
      event_key: eventKey,
      payload,
      processed: false,
    })
    .select("id")
    .maybeSingle();

  if (logError) {
    if (logError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[MOODLE_WEBHOOK] Audit insert failed:", logError.message);
    return NextResponse.json({ error: "Could not record Moodle event" }, { status: 500 });
  }

  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id, first_name, mobile, language_preference")
    .eq("moodle_user_id", moodleUserId)
    .single();
  if (driverError || !driver) {
    await supabase.from("moodle_webhook_log").update({ processed: true, error: "Driver not found" }).eq("id", logEntry?.id);
    return NextResponse.json({ ok: true, skipped: "driver not found" });
  }

  const { data: enrolment, error: enrolmentError } = await supabase
    .from("enrolments")
    .select("id, progress_percent, modules_completed, completed_at")
    .eq("driver_id", driver.id)
    .eq("programme_slug", programmeSlug)
    .in("status", ACTIVE_ENROLMENT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (enrolmentError || !enrolment) {
    await supabase
      .from("moodle_webhook_log")
      .update({ processed: true, error: enrolmentError?.message ?? "Active enrolment not found" })
      .eq("id", logEntry?.id);
    return NextResponse.json({ ok: true, skipped: "active enrolment not found" });
  }

  try {
    const snapshot = await moodleGetLearningSnapshot({ moodleUserId, programmeSlug });
    const eventModule = snapshot.modules.find((module) => module.id === moduleCmid);
    if (!eventModule) {
      throw new Error("Moodle event module is not part of the assigned programme");
    }

    const justCompleted = snapshot.completed && !enrolment.completed_at;
    const progressIncreased = snapshot.completedModules > enrolment.modules_completed;
    const changed =
      snapshot.progressPercent !== enrolment.progress_percent ||
      snapshot.completedModules !== enrolment.modules_completed ||
      justCompleted;

    if (changed) {
      const { error: updateError } = await supabase
        .from("enrolments")
        .update({
          progress_percent: snapshot.progressPercent,
          modules_completed: snapshot.completedModules,
          completed_at: justCompleted ? new Date().toISOString() : enrolment.completed_at,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", enrolment.id);
      if (updateError) throw new Error(updateError.message);
    }

    if (driver.mobile && justCompleted) {
      const language = (driver.language_preference ?? "en") as "en" | "zu";
      await sendWhatsAppMessage({
        to: driver.mobile,
        templateName: "bd_programme_complete",
        language,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: driver.first_name ?? "Driver" },
              {
                type: "text",
                text:
                  programmeSlug === "professional-truck-driver"
                    ? "Program 1: The Professional Truck Driver"
                    : "Program 2: Eco-Driving Mastery",
              },
            ],
          },
        ],
      });
    } else if (driver.mobile && progressIncreased && (completionState === 1 || completionState === 2)) {
      const language = (driver.language_preference ?? "en") as "en" | "zu";
      await sendWhatsAppMessage({
        to: driver.mobile,
        templateName: "bd_module_complete",
        language,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: driver.first_name ?? "Driver" },
              { type: "text", text: String(snapshot.completedModules) },
            ],
          },
        ],
      });
    }

    await supabase.from("moodle_webhook_log").update({ processed: true, error: null }).eq("id", logEntry?.id);
    return NextResponse.json({ ok: true, processed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Moodle processing error";
    console.error("[MOODLE_WEBHOOK] Processing failed:", message);
    await supabase.from("moodle_webhook_log").update({ error: message }).eq("id", logEntry?.id);
    return NextResponse.json({ error: "Could not process Moodle completion event" }, { status: 502 });
  }
}
