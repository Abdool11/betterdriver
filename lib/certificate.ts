import { supabaseAdmin } from "@/lib/supabase";

/**
 * Generate a unique certificate number in the format BD-YYYY-XXXXX
 * (e.g. BD-2026-00127). The sequential portion is derived from a
 * count of existing certificates for that year, padded to 5 digits.
 */
async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BD-${year}-`;

  const { count } = await supabaseAdmin
    .from("certifications")
    .select("id", { count: "exact", head: true })
    .like("certificate_number", `${prefix}%`);

  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

/**
 * Ensure a certificate record exists for a driver who has just completed
 * a programme. Idempotent — if one already exists (same driver + programme +
 * enrolment), the existing record is returned instead of creating a duplicate.
 */
export async function ensureCertificate(opts: {
  driverId: string;
  enrolmentId?: string;
  companyId?: string | null;
  programme: string; // "p1" | "p2" | "professional-truck-driver" | "eco-driver"
  enrolmentSlug?: string;
}): Promise<{ certificate_number: string; issued_at: string } | null> {
  const programmeCode =
    opts.programme === "p2" ||
    opts.programme === "eco-driver" ||
    opts.enrolmentSlug === "eco-driver"
      ? "p2"
      : "p1";

  // Check if a certificate already exists for this driver + programme + enrolment
  let query = supabaseAdmin
    .from("certifications")
    .select("certificate_number, issued_at")
    .eq("driver_id", opts.driverId)
    .eq("programme", programmeCode)
    .eq("status", "active")
    .order("issued_at", { ascending: false })
    .limit(1);

  if (opts.enrolmentId) {
    query = query.eq("enrolment_id", opts.enrolmentId);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    return existing;
  }

  // Generate a new certificate
  const certificateNumber = await generateCertificateNumber();

  const { data: cert, error } = await supabaseAdmin
    .from("certifications")
    .insert({
      driver_id: opts.driverId,
      company_id: opts.companyId ?? null,
      enrolment_id: opts.enrolmentId ?? null,
      certificate_number: certificateNumber,
      programme: programmeCode,
      issued_at: new Date().toISOString(),
      status: "active",
    })
    .select("certificate_number, issued_at")
    .single();

  if (error) {
    console.error("[CERTIFICATE] Failed to insert certification:", error.message);
    return null;
  }

  return cert;
}
