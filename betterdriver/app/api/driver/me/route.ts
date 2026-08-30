import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/driver/me
 * Returns the current driver's profile. Used by the portal layout to show
 * the driver's name in the sidebar and mobile app bar.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: driver, error } = await supabaseAdmin
    .from("drivers")
    .select("id, first_name, last_name, email, mobile, language_preference, moodle_user_id, profile_complete, company_id")
    .eq("id", session.driverId)
    .single();

  if (error || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  return NextResponse.json({
    driver: {
      id: driver.id,
      first_name: driver.first_name ?? session.firstName,
      last_name: driver.last_name ?? session.lastName,
      email: driver.email ?? session.email,
      mobile: driver.mobile,
      language_preference: driver.language_preference ?? session.languagePreference ?? "en",
      moodle_user_id: driver.moodle_user_id,
      profile_complete: driver.profile_complete,
      company_id: driver.company_id,
    },
  });
}
