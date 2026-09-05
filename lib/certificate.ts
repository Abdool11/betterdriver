import { supabaseAdmin } from "@/lib/supabase";

function programmeToCode(
  programme: string,
  enrolmentSlug?: string
): "p1" | "p2" {
  if (
    programme === "p2" ||
    programme === "eco-driver" ||
    enrolmentSlug === "eco-driver"
  ) {
    return "p2";
  }
  return "p1";
}

/**
 * Generate a candidate certificate number in the format BD-YYYY-XXXXX
 * (e.g. BD-2026-00127). The sequential portion is derived from a count of
 * existing certificates for that year, padded to 5 digits.
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
 * Retries on unique-constraint conflicts caused by concurrent inserts.
 */
export async function ensureCertificate(opts: {
  driverId: string;
  enrolmentId?: string;
  companyId?: string | null;
  programme: string; // "p1" | "p2" | "professional-truck-driver" | "eco-driver"
  enrolmentSlug?: string;
}): Promise<{ certificate_number: string; issued_at: string; created: boolean } | null> {
  const programmeCode = programmeToCode(opts.programme, opts.enrolmentSlug);

  console.log("[CERTIFICATE] ensureCertificate called", {
    driverId: opts.driverId,
    programmeCode,
    enrolmentId: opts.enrolmentId,
  });

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

  const { data: existing, error: existingError } = await query.maybeSingle();

  if (existingError) {
    console.error("[CERTIFICATE] Failed to lookup existing certificate:", existingError.message);
  }

  if (existing) {
    console.log("[CERTIFICATE] Found existing certificate:", existing.certificate_number);
    return { ...existing, created: false };
  }

  // Generate a new certificate with retry on duplicate number
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    const certificateNumber = await generateCertificateNumber();

    console.log("[CERTIFICATE] Attempting to insert certificate:", certificateNumber, "attempt", attempts);

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

    if (!error) {
      console.log("[CERTIFICATE] Created certificate:", cert.certificate_number);
      return { ...cert, created: true };
    }

    console.error("[CERTIFICATE] Insert failed:", error.message, error.code);

    // On unique violation, retry with a fresh number
    if (error.code === "23505") {
      continue;
    }

    return null;
  }

  console.error("[CERTIFICATE] Exceeded max retries creating certificate");
  return null;
}
