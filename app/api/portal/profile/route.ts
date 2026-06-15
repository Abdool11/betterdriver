import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/portal/profile — fetch full driver profile
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: driver, error } = await supabaseAdmin
    .from("drivers")
    .select(`
      id, first_name, last_name, email, mobile,
      id_number,
      licence_number, licence_class, licence_expiry,
      years_experience, vehicle_types,
      profile_complete,
      activation_status, activated_at
    `)
    .eq("id", session.driverId)
    .single();

  if (error || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  return NextResponse.json({ driver });
}

// PATCH /api/portal/profile — update driver profile fields
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Allowed fields for driver self-update
  const allowed = [
    "mobile",
    "id_number",
    "licence_number",
    "licence_class",
    "licence_expiry",
    "years_experience",
    "vehicle_types",
    "language_preference", // Required by the /portal/language selection screen
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Check if profile is now complete
  const { data: current } = await supabaseAdmin
    .from("drivers")
    .select("licence_number, licence_class, licence_expiry, years_experience, vehicle_types, id_number")
    .eq("id", session.driverId)
    .single();

  const merged = { ...current, ...updates };
  const isComplete = !!(
    merged.licence_number &&
    merged.licence_class &&
    merged.licence_expiry &&
    merged.years_experience &&
    merged.vehicle_types?.length > 0 &&
    merged.id_number
  );

  if (isComplete) {
    updates.profile_complete = true;
  }

  const { data: updated, error } = await supabaseAdmin
    .from("drivers")
    .update(updates)
    .eq("id", session.driverId)
    .select("id, first_name, last_name, profile_complete")
    .single();

  if (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, driver: updated, profileComplete: updated.profile_complete });
}
