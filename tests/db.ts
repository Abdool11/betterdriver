import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { SignJWT } from "jose";

// Load environment variables from BetterDriver
dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bdJwtSecret = process.env.BD_JWT_SECRET || process.env.JWT_SECRET || "bd-dev-secret-change-in-production";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase credentials not found in betterdriver/.env.local. Database fixtures will be disabled.");
}

export const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function createTestCompany(companyData: any) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: companyData.companyName,
      contact_name: companyData.contactName,
      contact_email: companyData.email,
      contact_phone: companyData.phone,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createTestDriver(driverData: any, companyId?: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("drivers")
    .insert({
      full_name: `${driverData.firstname} ${driverData.lastname}`,
      email: driverData.email,
      phone: driverData.phone,
      employer_company_id: companyId,
      activation_status: "pending",
      profile_complete: false,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createInvitation(driverId: string, companyId: string, options: { expires_at?: string; revoked_at?: string } = {}) {
  if (!supabase) return null;
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const defaultExpiry = new Date();
  defaultExpiry.setDate(defaultExpiry.getDate() + 30);
  
  const { data, error } = await supabase
    .from("driver_invitations")
    .insert({
      driver_id: driverId,
      company_id: companyId,
      token,
      driver_name: "Test Driver",
      programme_slug: "driver-training",
      expires_at: options.expires_at || defaultExpiry.toISOString(),
      revoked_at: options.revoked_at,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function enrolDriver(driverId: string, companyId: string, courseId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("enrolments")
    .insert({
      driver_id: driverId,
      company_id: companyId,
      course_id: courseId,
      status: "enrolled",
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getDriverSessionToken(driver: any, invitation?: any) {
  const secret = new TextEncoder().encode(bdJwtSecret);
  const [firstName = "", ...lastNameParts] = (driver.full_name || "").split(" ");
  const lastName = lastNameParts.join(" ");

  const payload = {
    driverId: driver.id,
    email: driver.email,
    firstName,
    lastName,
    role: "driver",
    fleetId: driver.employer_company_id,
    programAssignment: invitation?.programme_slug || "p1",
    languagePreference: driver.language_preference || "en",
    invitationId: invitation?.id,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  
  return token;
}

export async function cleanupTestDriver(driverId: string, companyId?: string) {
  if (!supabase) return;
  await supabase.from("enrolments").delete().eq("driver_id", driverId);
  await supabase.from("driver_invitations").delete().eq("driver_id", driverId);
  await supabase.from("drivers").delete().eq("id", driverId);
  if (companyId) {
    await supabase.from("companies").delete().eq("id", companyId);
  }
}
