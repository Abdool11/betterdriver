import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateMoodleAutoLoginUrl, normalizeProgrammeSlug } from "@/lib/moodle";

/**
 * POST /api/moodle/autologin
 * Generates a signed one-time auto-login URL for embedding Moodle content in an iframe.
 *
 * Body: { redirectUrl: string }
 * Response: { url: string } | { error: string }
 *
 * The returned URL points to a PHP script on the Moodle server that verifies the
 * signed JWT, logs the driver in via Moodle's internal API, and redirects to the
 * requested course module.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let redirectUrl: string;
  try {
    const body = await req.json();
    redirectUrl = body.redirectUrl;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!redirectUrl || typeof redirectUrl !== "string") {
    return NextResponse.json({ error: "redirectUrl is required" }, { status: 400 });
  }

  // Fetch driver profile including moodle_user_id
  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, moodle_user_id, email")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver) {
    console.error("[AUTOLOGIN] Driver not found:", driverErr?.message);
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  if (!driver.moodle_user_id) {
    return NextResponse.json(
      { error: "Driver has no Moodle account. Visit the dashboard to provision one." },
      { status: 400 }
    );
  }

  const url = await generateMoodleAutoLoginUrl({
    moodleUserId: driver.moodle_user_id,
    redirectUrl,
  });

  if (!url) {
    return NextResponse.json(
      { error: "Auto-login is not configured. Check MOODLE_AUTOLOGIN_SECRET." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url });
}
