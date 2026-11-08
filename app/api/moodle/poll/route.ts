import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import { moodleGetLearningSnapshot, normalizeProgrammeSlug } from "@/lib/moodle";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dummy"
  );

const POLL_SECRET = process.env.MOODLE_POLL_SECRET ?? "";

/**
 * POST /api/moodle/poll
 * Recovery sync for authenticated scheduler calls. It uses the same
 * driver-specific activity snapshot as the portal and webhook, never a
 * separate aggregate completion algorithm.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = authHeader.replace("Bearer ", "").trim();
  if (!POLL_SECRET || secret !== POLL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: enrolments, error } = await supabase
    .from("enrolments")
    .select(`
      id,
      driver_id,
      programme_slug,
      progress_percent,
      modules_completed,
      completed_at,
      drivers (
        id,
        first_name,
        mobile,
        language_preference,
        moodle_user_id
      )
    `)
    .in("status", ACTIVE_ENROLMENT_STATUSES)
    .not("drivers.moodle_user_id", "is", null);

  if (error) {
    console.error("[MOODLE_POLL] Enrolment fetch failed:", error.message);
    return NextResponse.json({ error: "Could not load active enrolments" }, { status: 500 });
  }
  if (!enrolments?.length) {
    return NextResponse.json({ ok: true, processed: 0, updated: 0, completions: 0 });
  }

  let updated = 0;
  let completions = 0;
  const errors: string[] = [];

  for (const enrolment of enrolments) {
    const driver = Array.isArray(enrolment.drivers) ? enrolment.drivers[0] : enrolment.drivers;
    if (!driver?.moodle_user_id) continue;

    try {
      const snapshot = await moodleGetLearningSnapshot({
        moodleUserId: driver.moodle_user_id,
        programmeSlug: normalizeProgrammeSlug(enrolment.programme_slug ?? "professional-truck-driver"),
      });
      const justCompleted = snapshot.completed && !enrolment.completed_at;
      const changed =
        snapshot.progressPercent !== enrolment.progress_percent ||
        snapshot.completedModules !== enrolment.modules_completed ||
        justCompleted;
      if (!changed) continue;

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
      updated++;

      if (justCompleted && driver.mobile) {
        completions++;
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
                    normalizeProgrammeSlug(enrolment.programme_slug ?? "professional-truck-driver") === "professional-truck-driver"
                      ? "Program 1: The Professional Truck Driver"
                      : "Program 2: Eco-Driving Mastery",
                },
              ],
            },
          ],
        });
      }
    } catch (pollError) {
      const message = pollError instanceof Error ? pollError.message : String(pollError);
      errors.push(`enrolment ${enrolment.id}: ${message}`);
    }
  }

  return NextResponse.json({
    ok: true,
    processed: enrolments.length,
    updated,
    completions,
    errors: errors.length ? errors : undefined,
  });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = authHeader.replace("Bearer ", "").trim();
  if (!POLL_SECRET || secret !== POLL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("enrolments")
    .select("id", { count: "exact", head: true })
    .in("status", ACTIVE_ENROLMENT_STATUSES);
  if (error) {
    console.error("[MOODLE_POLL] Health check failed:", error.message);
    return NextResponse.json({ error: "Could not count active enrolments" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, active_enrolments: count ?? 0 });
}
