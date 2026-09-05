import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/verify/[certNumber]
 * Public endpoint — verifies a certificate by its number.
 * Returns driver name, programme, and issue date if valid.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await params;

  if (!certNumber) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const { data: cert, error } = await supabaseAdmin
    .from("certifications")
    .select(`
      certificate_number,
      issued_at,
      status,
      programme,
      driver_id,
      drivers:driver_id (first_name, last_name)
    `)
    .eq("certificate_number", certNumber)
    .eq("status", "active")
    .maybeSingle();

  if (error || !cert) {
    return NextResponse.json({ valid: false });
  }

  const driver = cert.drivers as unknown as { first_name: string; last_name: string } | null;
  const driverName = driver
    ? `${driver.first_name ?? ""} ${driver.last_name ?? ""}`.trim()
    : "Unknown";

  const programmeName =
    cert.programme === "p2" || cert.programme === "eco-driver"
      ? "Eco-Driver Training"
      : "The Professional Truck Driver Programme";

  const issuedDate = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return NextResponse.json({
    valid: true,
    driverName,
    programmeName,
    issuedAt: issuedDate,
    certificateNumber: cert.certificate_number,
    status: cert.status,
  });
}
