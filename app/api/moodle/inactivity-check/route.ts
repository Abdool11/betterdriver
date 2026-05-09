/**
 * POST /api/moodle/inactivity-check
 * ==================================
 * Sends WhatsApp inactivity reminders to drivers who have not been active
 * for 7 days (Trigger 4) or 14 days (Trigger 5).
 *
 * SETUP (Asif — see MOODLE_SETUP.md):
 * ------------------------------------
 * Run daily via cron. Recommended schedule: 09:00 SAST (07:00 UTC).
 *
 * Vercel Cron (vercel.json):
 *   { "path": "/api/moodle/inactivity-check", "schedule": "0 7 * * *" }
 *
 * Server cron:
 *   0 7 * * * curl -X POST https://betterdriver.co.za/api/moodle/inactivity-check \
 *     -H "Authorization: Bearer $MOODLE_POLL_SECRET"
 *
 * Logic:
 * - 7 days inactive → send Trigger 4 (once only, tracked via wa_7day_sent_at)
 * - 14 days inactive → send Trigger 5 (once only, tracked via wa_14day_sent_at)
 * - Drivers who have completed their programme are excluded
 *
 * Template parameters (bd_inactivity_7day and bd_inactivity_14day):
 *   {{1}} = driver first name
 *   {{2}} = modules completed count
 * (Portal URL is hardcoded in the Meta template body — not passed as a variable)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// Lazy initialize to avoid build-time errors when env vars are missing
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dummy"
);

const POLL_SECRET = process.env.MOODLE_POLL_SECRET ?? "";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = authHeader.replace("Bearer ", "").trim();
  if (POLL_SECRET && secret !== POLL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch active, incomplete enrolments with last_activity_at older than 7 days
  const supabase = getSupabase();
  const { data: enrolments, error } = await supabase
    .from("enrolments")
    .select(`
      id,
      driver_id,
      programme_slug,
      modules_completed,
      last_activity_at,
      wa_7day_sent_at,
      wa_14day_sent_at,
      drivers (
        id,
        first_name,
        mobile,
        language_preference
      )
    `)
    .eq("status", "active")
    .is("completed_at", null)
    .lt("last_activity_at", sevenDaysAgo);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent7day = 0;
  let sent14day = 0;

  for (const enrolment of enrolments ?? []) {
    const driver = Array.isArray(enrolment.drivers) ? enrolment.drivers[0] : enrolment.drivers;
    if (!driver?.mobile) continue;

    const lang = (driver.language_preference ?? "en") as "en" | "zu";
    const lastActivity = enrolment.last_activity_at ? new Date(enrolment.last_activity_at) : null;
    const isOlderThan14 = lastActivity && lastActivity < new Date(fourteenDaysAgo);
    const modulesCompleted = String(enrolment.modules_completed ?? 0);

    if (isOlderThan14 && !enrolment.wa_14day_sent_at) {
      // Send Trigger 5 — 14-day reminder
      // Template: bd_inactivity_14day
      //   {{1}} = driver first name
      //   {{2}} = modules completed
      //   (portal URL is hardcoded in the Meta template body)
      await sendWhatsAppMessage({
        to: driver.mobile,
        templateName: "bd_inactivity_14day",
        language: lang,
        components: [
          { type: "body", parameters: [
            { type: "text", text: driver.first_name },
            { type: "text", text: modulesCompleted },
          ]},
        ],
      });
      await supabase
        .from("enrolments")
        .update({ wa_14day_sent_at: now.toISOString() })
        .eq("id", enrolment.id);
      sent14day++;
    } else if (!isOlderThan14 && !enrolment.wa_7day_sent_at) {
      // Send Trigger 4 — 7-day reminder
      // Template: bd_inactivity_7day
      //   {{1}} = driver first name
      //   {{2}} = modules completed
      //   (portal URL is hardcoded in the Meta template body)
      await sendWhatsAppMessage({
        to: driver.mobile,
        templateName: "bd_inactivity_7day",
        language: lang,
        components: [
          { type: "body", parameters: [
            { type: "text", text: driver.first_name },
            { type: "text", text: modulesCompleted },
          ]},
        ],
      });
      await supabase
        .from("enrolments")
        .update({ wa_7day_sent_at: now.toISOString() })
        .eq("id", enrolment.id);
      sent7day++;
    }
  }

  return NextResponse.json({
    ok: true,
    checked: (enrolments ?? []).length,
    sent_7day: sent7day,
    sent_14day: sent14day,
  });
}
