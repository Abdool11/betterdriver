import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.BD_JWT_SECRET || process.env.JWT_SECRET || "bd-secret-change-me"
);
const COOKIE_NAME = "bd_session";

// ─── Session types ────────────────────────────────────────────────────────────

export type BDRole = "driver" | "admin";

export interface DriverSession {
  driverId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: BDRole;
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

// ─── Create / get / clear session ────────────────────────────────────────────

export async function createSession(driver: DriverSession): Promise<string> {
  const token = await new SignJWT({ ...driver })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
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

export async function getSession(): Promise<DriverSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    const decoded = payload as unknown as DriverSession | BDAdminSession;
    if (isDriverSession(decoded)) return decoded;
    return null;
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
    redirect("/login");
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

// ─── Verify credentials ───────────────────────────────────────────────────────

export async function verifyDriverCredentials(
  email: string,
  password: string
): Promise<DriverSession | null> {
  const bcrypt = await import("bcryptjs");
  const { data: driver } = await supabaseAdmin
    .from("drivers")
    .select("id, first_name, last_name, email, password_hash")
    .eq("email", email.toLowerCase())
    .single();

  if (!driver || !driver.password_hash) return null;

  const valid = await bcrypt.compare(password, driver.password_hash);
  if (!valid) return null;

  return {
    driverId: driver.id,
    email: driver.email,
    firstName: driver.first_name,
    lastName: driver.last_name,
    role: "driver",
  };
}

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

  return {
    adminId: admin.id,
    name: admin.name,
    email: admin.email,
    role: "admin",
  };
}
