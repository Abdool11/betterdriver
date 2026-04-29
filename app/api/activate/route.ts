import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/activate?token=xxx — validate token, return driver info
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const { data: invitation, error } = await supabaseAdmin
    .from("driver_invitations")
    .select(`
      id,
      token,
      driver_id,
      deployment_id,
      expires_at,
      activated_at,
      drivers (
        id, first_name, last_name, email, mobile,
        activation_status, profile_complete, password_hash
      )
    `)
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: "Invalid or expired activation link" }, { status: 404 });
  }

  if (invitation.activated_at) {
    return NextResponse.json({ error: "This activation link has already been used" }, { status: 409 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: "This activation link has expired. Please contact your fleet manager." }, { status: 410 });
  }

  const driver = invitation.drivers as unknown as Record<string, unknown>;
  return NextResponse.json({
    valid: true,
    driverId: invitation.driver_id,
    invitationId: invitation.id,
    firstName: driver?.first_name,
    lastName: driver?.last_name,
    email: driver?.email,
    mobile: driver?.mobile,
    needsPassword: !driver?.password_hash,
    profileComplete: driver?.profile_complete ?? false,
  });
}

// POST /api/activate — set password and activate account
export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Validate token
  const { data: invitation } = await supabaseAdmin
    .from("driver_invitations")
    .select("id, driver_id, expires_at, activated_at")
    .eq("token", token)
    .single();

  if (!invitation) {
    return NextResponse.json({ error: "Invalid activation link" }, { status: 404 });
  }

  if (invitation.activated_at) {
    return NextResponse.json({ error: "This link has already been used" }, { status: 409 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: "Activation link has expired" }, { status: 410 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  // Update driver: set password, mark activated
  const { data: driver, error: driverError } = await supabaseAdmin
    .from("drivers")
    .update({
      password_hash: passwordHash,
      activation_status: "activated",
      activated_at: now,
    })
    .eq("id", invitation.driver_id)
    .select("id, first_name, last_name, email")
    .single();

  if (driverError || !driver) {
    console.error("Driver update error:", driverError);
    return NextResponse.json({ error: "Activation failed" }, { status: 500 });
  }

  // Mark invitation as used
  await supabaseAdmin
    .from("driver_invitations")
    .update({ activated_at: now })
    .eq("id", invitation.id);

  // Create session and set cookie
  const session = {
    driverId: driver.id,
    email: driver.email ?? "",
    firstName: driver.first_name,
    lastName: driver.last_name,
    role: "driver" as const,
  };

  // Use the auth helper to create session cookie
  await createSession(session);

  return NextResponse.json({
    ok: true,
    firstName: driver.first_name,
    redirectTo: "/portal/setup",
  });
}
