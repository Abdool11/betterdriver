/**
 * GET /api/verify/[certNumber]
 * ════════════════════════════════════════════════════════════════════════════
 * PUBLIC endpoint — no authentication required.
 *
 * Verifies a single certificate by its certificate number.
 * Used by:
 *   - The /verify/[certNumber] public page
 *   - QR codes printed on PDF certificates
 *   - Third-party employer verification
 *
 * RESPONSE (200):
 *   {
 *     valid: true,
 *     driverName: string,
 *     programme: string,
 *     issuedAt: string,
 *     certificateNumber: string,
 *     status: "active"
 *   }
 *
 * RESPONSE (404):
 *   { valid: false, error: "Certificate not found" }
 *
 * RESPONSE (200 with revoked):
 *   { valid: false, status: "revoked", revokedAt: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "dummy",
  );

export async function GET(
  _req: NextRequest,
  { params }: { params: { certNumber: string } },
) {
  const certNumber = params.certNumber?.toUpperCase();
  if (!certNumber) {
    return NextResponse.json({ valid: false, error: "Certificate number required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: cert, error } = await supabase
    .from("certifications")
    .select(`
      id,
      certificate_number,
      programme,
      issued_at,
      status,
      revoked_at,
      drivers!inner (
        first_name,
        last_name
      )
    `)
    .eq("certificate_number", certNumber)
    .single();

  if (error || !cert) {
    return NextResponse.json({ valid: false, error: "Certificate not found" }, { status: 404 });
  }

  const driver = cert.drivers as unknown as { first_name: string; last_name: string } | null;
  const driverName = driver ? `${driver.first_name} ${driver.last_name}` : "Unknown Driver";

  if (cert.status === "revoked") {
    return NextResponse.json({
      valid: false,
      status: "revoked",
      revokedAt: cert.revoked_at ?? null,
      certificateNumber: cert.certificate_number,
    });
  }

  return NextResponse.json(
    {
      valid: true,
      driverName,
      programme: cert.programme ?? "BetterDriver Programme",
      issuedAt: cert.issued_at,
      certificateNumber: cert.certificate_number,
      status: "active",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
