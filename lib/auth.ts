import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";

// ─── Constants ────────────────────────────────────────────────────────────────
const COOKIE_NAME = "bd_session";
const SECRET = new TextEncoder().encode(
  process.env.BD_JWT_SECRET ?? process.env.JWT_SECRET ?? "bd-dev-secret-change-in-production"
);

// ─── Session types ────────────────────────────────────────────────────────────
export type BDRole = "driver" | "admin";

export interface DriverSession {
  driverId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: BDRole;
  fleetId?: string;
  programAssignment?: "p1" | "p2" | "p1_p2";
  cohortId?: string;
  campaignExpiry?: string;
  languagePreference?: string;
  invitationId?: string;
}

export interface BDAdminSession {
  adminId: string;
  name: string;
  email: string;
  role: "admin";
}

// ─── Type guards ──────────────────────────────────────────────────────────────
export function isBDAdminSession(s: DriverSession | BDAdminSession): s is BDAdminSession {
  return "adminId" in s;
}
export function isDriverSession(s: DriverSession | BDAdminSession): s is DriverSession {
  return "driverId" in s;
}

// ─── Create sessions ──────────────────────────────────────────────────────────
export async function createSession(driver: DriverSession): Promise<string> {
  const token = await new SignJWT({ ...driver })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
  const cookieStore = await cookies();
  // httpOnly JWT — not readable by client-side JS
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  // Thin readable cookie for client-side language switching (not sensitive)
  cookieStore.set("bd_lang", driver.languagePreference ?? "en", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return token;
}

export async function createAdminSession(admin: BDAdminSession): Promise<string> {
  const token = await new SignJWT({ ...admin })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return token;
}

// ─── Revocation check ─────────────────────────────────────────────────────────
export async function isDriverRevoked(driverId: string, invitationId?: string): Promise<boolean> {
  const { data: blocked } = await supabaseAdmin
    .from("session_token_blocklist")
    .select("id")
    .eq("driver_id", driverId)
    .limit(1)
    .maybeSingle();
  if (blocked) return true;

  if (invitationId) {
    const { data: invitation } = await supabaseAdmin
      .from("driver_invitations")
      .select("revoked_at")
      .eq("id", invitationId)
      .maybeSingle();
    if (invitation?.revoked_at) return true;
  }
  return false;
}

// ─── Get sessions ─────────────────────────────────────────────────────────────
export async function getSession(): Promise<DriverSession | null> {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get(COOKIE_NAME)?.value;
    
    // Fallback: check Authorization header for API requests
    if (!token) {
      const { headers } = await import("next/headers");
      const authHeader = headers().get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    const decoded = payload as unknown as DriverSession | BDAdminSession;
    if (!isDriverSession(decoded)) return null;
    const revoked = await isDriverRevoked(decoded.driverId, decoded.invitationId);
    if (revoked) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function getBDAdminSession(): Promise<BDAdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    const decoded = payload as unknown as DriverSession | BDAdminSession;
    if (isBDAdminSession(decoded)) return decoded;
    return null;
  } catch {
    return null;
  }
}

export async function getAnyBDSession(): Promise<DriverSession | BDAdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as DriverSession | BDAdminSession;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ─── Require session guards ───────────────────────────────────────────────────
export async function requireDriverSession(): Promise<DriverSession> {
  const session = await getSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/start");
  }
  return session as DriverSession;
}

export async function requireBDAdminSession(): Promise<BDAdminSession> {
  const session = await getBDAdminSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
  return session as BDAdminSession;
}

// ─── Magic link resolution (hybrid token model) ───────────────────────────────
export async function resolveInvitationToken(opaqueToken: string): Promise<
  | { session: DriverSession; isFirstAccess: boolean; inviteVideoUrl?: string }
  | { error: string; code: "invalid" | "revoked" | "expired" }
> {
  console.error("[RESOLVE_INVITE] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.error("[RESOLVE_INVITE] Full token queried:", opaqueToken);
  console.error("[RESOLVE_INVITE] Token length:", opaqueToken.length);

  // Diagnostic: count total invitations to verify DB connectivity
  const { count, error: countErr } = await supabaseAdmin
    .from("driver_invitations")
    .select("id", { count: "exact", head: true });
  console.error("[RESOLVE_INVITE] Total invitations in DB:", count, "countError:", countErr?.message ?? "none");

  // Diagnostic: try to find the token without .single() first
  const { data: tokenCheck, error: tokenCheckErr } = await supabaseAdmin
    .from("driver_invitations")
    .select("id, token, driver_id")
    .eq("token", opaqueToken);
  console.error("[RESOLVE_INVITE] Token check rows:", tokenCheck?.length ?? 0, "tokenCheckError:", tokenCheckErr?.message ?? "none");

  const { data: invitation, error } = await supabaseAdmin
    .from("driver_invitations")
    .select(`
      id, token, driver_id, company_id,
      expires_at, first_accessed_at, revoked_at,
      program_assignment,
      drivers ( id, first_name, last_name, email, mobile, activation_status, profile_complete, language_preference ),
      companies ( id, name )
    `)
    .eq("token", opaqueToken)
    .single();

  if (error) {
    console.error("[RESOLVE_INVITE] Supabase query error for token", opaqueToken, "message:", error.message, "details:", error.details, "hint:", error.hint);
    return { error: "This activation link is not valid.", code: "invalid" };
  }
  if (!invitation) {
    console.error("[RESOLVE_INVITE] No invitation found for token", opaqueToken);
    return { error: "This activation link is not valid.", code: "invalid" };
  }
  if (invitation.revoked_at) return { error: "This link has been deactivated. Please contact your fleet manager.", code: "revoked" };
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) return { error: "This link has expired. Please contact your fleet manager.", code: "expired" };

  const driver = invitation.drivers as unknown as Record<string, unknown>;
  const company = invitation.companies as unknown as Record<string, unknown>;
  const isFirstAccess = !invitation.first_accessed_at;

  if (isFirstAccess) {
    await supabaseAdmin
      .from("driver_invitations")
      .update({ first_accessed_at: new Date().toISOString() })
      .eq("id", invitation.id);
    await supabaseAdmin
      .from("drivers")
      .update({ activation_status: "activated", activated_at: new Date().toISOString() })
      .eq("id", invitation.driver_id);
  }

  const firstName = (driver?.first_name as string) ?? "";
  const lastName = (driver?.last_name as string) ?? "";

  const session: DriverSession = {
    driverId: invitation.driver_id,
    email: (driver?.email as string) ?? "",
    firstName,
    lastName,
    role: "driver",
    fleetId: (company?.id as string) ?? undefined,
    programAssignment: (invitation.program_assignment as "p1" | "p2" | "p1_p2") ?? "p1",
    cohortId: undefined, // No cohort_id in this schema
    campaignExpiry: invitation.expires_at ?? undefined,
    languagePreference: (driver?.language_preference as string) ?? "en",
    invitationId: invitation.id,
  };

  return { session, isFirstAccess, inviteVideoUrl: undefined };
}

// ─── Admin credentials ────────────────────────────────────────────────────────
export async function verifyBDAdminCredentials(
  email: string,
  password: string
): Promise<BDAdminSession | null> {
  const bcrypt = await import("bcryptjs");
  const { data: admin } = await supabaseAdmin
    .from("bd_admins")
    .select("id, name, email, password_hash")
    .eq("email", email.toLowerCase())
    .single();
  if (!admin || !admin.password_hash) return null;
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return null;
  return { adminId: admin.id, name: admin.name, email: admin.email, role: "admin" };
}

// ─── Revoke a driver session ──────────────────────────────────────────────────
export async function revokeDriverSession(driverId: string, reason?: string): Promise<void> {
  await supabaseAdmin.from("session_token_blocklist").insert({
    driver_id: driverId,
    reason: reason ?? "operator_revoked",
  });
}
