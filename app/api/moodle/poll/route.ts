/**
 * POST /api/moodle/poll
 * =====================
 * Polling fallback — syncs progress from Moodle for all active enrolments.
 * Called by a cron job (e.g., Vercel Cron, GitHub Actions, or a server cron).
 *
 * SETUP (Asif — see MOODLE_SETUP.md for full instructions):
 * ----------------------------------------------------------
 * Option A — Vercel Cron (if hosting on Vercel):
 *   Add to vercel.json:
 *   {
 *     "crons": [{ "path": "/api/moodle/poll", "schedule": "0 * * * *" }]
 *   }
 *   This runs the poll every hour.
 *
 * Option B — Server cron (if self-hosting with PM2):
 *   Add to crontab: 0 * * * * curl -X POST https://betterdriver.co.za/api/moodle/poll \
 *     -H "Authorization: Bearer $MOODLE_POLL_SECRET"
 *
 * Add to .env.local:
 *   MOODLE_POLL_SECRET=your_cron_secret_here
 *
 * The poll is designed to be safe to run frequently — it only updates records
 * where progress has changed, and fires WhatsApp messages only for new completions.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import { moodleGetProgress } from "@/lib/moodle";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// Lazy initialize to avoid build-time errors when env vars are missing
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dummy"
);

const POLL_SECRET = process.env.MOODLE_POLL_SECRET ?? "";

export async function POST(req: NextRequest) {
  // ── 1. Verify cron secret ────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = authHeader.replace("Bearer ", "").trim();
  if (POLL_SECRET && secret !== POLL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Fetch all active enrolments with a moodle_user_id ─────────────────
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
        last_name,
        mobile,
        language_preference,
        moodle_user_id
      )
    `)
    .in("status", ACTIVE_ENROLMENT_STATUSES)
    .not("drivers.moodle_user_id", "is", null);

  if (error) {
    console.error("[MOODLE_POLL] Error fetching enrolments:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!enrolments || enrolments.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: "No active enrolments with Moodle users" });
  }

  let updated = 0;
  let completions = 0;
  const errors: string[] = [];

  for (const enrolment of enrolments) {
    const driver = Array.isArray(enrolment.drivers) ? enrolment.drivers[0] : enrolment.drivers;
    if (!driver?.moodle_user_id) continue;

    try {
      const progress = await moodleGetProgress({
        moodleUserId: driver.moodle_user_id,
        programmeSlug: enrolment.programme_slug as "professional-truck-driver" | "eco-driver",
      });

      const isNowComplete = progress.completed && !enrolment.completed_at;
      const progressChanged =
        progress.progressPercent !== enrolment.progress_percent ||
        progress.completedmodules !== enrolment.modules_completed ||
        isNowComplete;

      if (!progressChanged) continue;

      await supabase
        .from("enrolments")
        .update({
          progress_percent: progress.progressPercent,
          modules_completed: progress.completedmodules,
          completed_at: isNowComplete ? new Date().toISOString() : enrolment.completed_at,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", enrolment.id);

      updated++;

      // Fire programme complete WhatsApp only on first completion detection
      if (isNowComplete && driver.mobile) {
        completions++;
        const lang = (driver.language_preference ?? "en") as "en" | "zu";
        // Template: bd_programme_complete
        //   {{1}} = driver first name
        //   {{2}} = programme name
        //   (portal URL is hardcoded in the Meta template body)
        const firstName = (driver.first_name || "");
        await sendWhatsAppMessage({
          to: driver.mobile,
          templateName: "bd_programme_complete",
          language: lang,
          components: [
            { type: "body", parameters: [
              { type: "text", text: firstName },
              { type: "text", text: enrolment.programme_slug === "professional-truck-driver"
                ? "Program 1: The Professional Truck Driver"
                : "Program 2: Eco-Driving Mastery" },
            ]},
          ],
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`enrolment ${enrolment.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    ok: true,
    total: enrolments.length,
    updated,
    completions,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * GET /api/moodle/poll — health check endpoint
 * Returns the count of active enrolments pending sync.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = authHeader.replace("Bearer ", "").trim();
  if (POLL_SECRET && secret !== POLL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { count } = await supabase
    .from("enrolments")
    .select("id", { count: "exact", head: true })
    .in("status", ACTIVE_ENROLMENT_STATUSES);

  return NextResponse.json({ ok: true, active_enrolments: count ?? 0 });
}
