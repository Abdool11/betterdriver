/**
 * POST /api/moodle/webhook
 * ========================
 * Receives completion events from Moodle via the Moodle Outgoing Webhooks plugin
 * (or the custom event handler Asif configures in Moodle).
 *
 * SETUP (Asif — see MOODLE_SETUP.md for full instructions):
 * ----------------------------------------------------------
 * 1. Install the "Outgoing webhooks" plugin in Moodle:
 *    https://moodle.org/plugins/local_outgoing_webhooks
 *    OR use Moodle's built-in "Event monitoring" with a custom handler.
 *
 * 2. Configure the webhook URL in Moodle:
 *    Site Admin → Plugins → Local → Outgoing webhooks → Add rule
 *    Event: \core\event\course_module_completion_updated
 *    URL:   https://betterdriver.co.za/api/moodle/webhook
 *    Secret: set MOODLE_WEBHOOK_SECRET in .env.local (same value in Moodle)
 *
 * 3. Add to .env.local:
 *    MOODLE_WEBHOOK_SECRET=your_shared_secret_here
 *
 * PAYLOAD SHAPE (from Moodle outgoing webhooks plugin):
 * {
 *   "event": "\\core\\event\\course_module_completion_updated",
 *   "userid": 42,
 *   "courseid": 5,
 *   "contextinstanceid": 123,   // the course module (activity) ID
 *   "completionstate": 1,       // 1 = complete, 2 = complete (pass), 3 = complete (fail)
 *   "timecreated": 1714900000
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import { moodleGetProgress, MOODLE_COURSE_IDS } from "@/lib/moodle";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { ensureCertificate } from "@/lib/certificate";

// Lazy initialize to avoid build-time errors when env vars are missing
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dummy"
);

const WEBHOOK_SECRET = process.env.MOODLE_WEBHOOK_SECRET ?? "";

// Map Moodle course IDs back to programme slugs
const COURSE_ID_TO_SLUG: Record<number, string> = {
  [parseInt(process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID ?? "0")]: "professional-truck-driver",
  [parseInt(process.env.MOODLE_ECO_DRIVER_COURSE_ID ?? "0")]: "eco-driver",
};

export async function POST(req: NextRequest) {
  // ── 1. Verify shared secret ──────────────────────────────────────────────
  const authHeader = req.headers.get("x-moodle-secret") ?? req.headers.get("authorization") ?? "";
  const secret = authHeader.replace("Bearer ", "").trim();
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    console.warn("[MOODLE_WEBHOOK] Invalid secret — rejecting request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse payload ─────────────────────────────────────────────────────
  let payload: {
    event?: string;
    userid?: number;
    courseid?: number;
    completionstate?: number;
    timecreated?: number;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userid: moodleUserId, courseid, completionstate } = payload;

  // We only care about completion events
  if (!moodleUserId || !courseid) {
    return NextResponse.json({ ok: true, skipped: "missing fields" });
  }

  const programmeSlug = COURSE_ID_TO_SLUG[courseid];
  if (!programmeSlug) {
    // Not a course we track — ignore silently
    return NextResponse.json({ ok: true, skipped: "unknown course" });
  }

  // ── 3. Find the driver in our DB by moodle_user_id ───────────────────────
  const supabase = getSupabase();
  const { data: driver, error: driverErr } = await supabase
    .from("drivers")
    .select("id, first_name, mobile, language_preference")
    .eq("moodle_user_id", moodleUserId)
    .single();

  if (driverErr || !driver) {
    console.warn("[MOODLE_WEBHOOK] Driver not found for moodle_user_id:", moodleUserId);
    return NextResponse.json({ ok: true, skipped: "driver not found" });
  }

  // ── 4. Fetch full progress from Moodle to get accurate module count ───────
  const progress = await moodleGetProgress({ moodleUserId, programmeSlug: programmeSlug as "professional-truck-driver" | "eco-driver" });

  // ── 5. Update progress in Supabase ───────────────────────────────────────
  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("id, completed_at, modules_completed")
    .eq("driver_id", driver.id)
    .eq("programme_slug", programmeSlug)
    .in("status", ACTIVE_ENROLMENT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrolment) {
    const isNowComplete = progress.completed && !enrolment.completed_at;

    await supabase
      .from("enrolments")
      .update({
        progress_percent: progress.progressPercent,
        modules_completed: progress.completedmodules,
        completed_at: isNowComplete ? new Date().toISOString() : enrolment.completed_at,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", enrolment.id);

    // ── 6. Fire WhatsApp notifications ─────────────────────────────────────
    if (driver.mobile) {
      const lang = (driver.language_preference ?? "en") as "en" | "zu";

      if (isNowComplete) {
        // Auto-create certificate record
        const cert = await ensureCertificate({
          driverId: driver.id,
          enrolmentId: enrolment.id,
          programme: programmeSlug === "professional-truck-driver" ? "p1" : "p2",
          enrolmentSlug: programmeSlug,
        });

        if (cert) {
          console.log("[MOODLE_WEBHOOK] Certificate ensured:", cert.certificate_number, "created:", cert.created);
        } else {
          console.error("[MOODLE_WEBHOOK] ensureCertificate returned null for driver", driver.id);
        }

        // TRIGGER 6 — Programme complete
        // Template: bd_programme_complete
        //   {{1}} = driver first name
        //   {{2}} = programme name
        //   (portal URL is hardcoded in the Meta template body)
        await sendWhatsAppMessage({
          to: driver.mobile,
          templateName: "bd_programme_complete",
          language: lang,
          components: [
            { type: "body", parameters: [
              { type: "text", text: driver.first_name },
              { type: "text", text: programmeSlug === "professional-truck-driver" ? "Program 1: The Professional Truck Driver" : "Program 2: Eco-Driving Mastery" },
            ]},
          ],
        });
      } else if (completionstate === 1 || completionstate === 2) {
        // TRIGGER 3 — Module complete (activity completion event)
        // Template: bd_module_complete
        //   {{1}} = driver first name
        //   {{2}} = module number
        //   (portal URL is hardcoded in the Meta template body)
        const moduleNum = progress.completedmodules;
        await sendWhatsAppMessage({
          to: driver.mobile,
          templateName: "bd_module_complete",
          language: lang,
          components: [
            { type: "body", parameters: [
              { type: "text", text: driver.first_name },
              { type: "text", text: String(moduleNum) },
            ]},
          ],
        });
      }
    }
  }

  return NextResponse.json({ ok: true, processed: true });
}
