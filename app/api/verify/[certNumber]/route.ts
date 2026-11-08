import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/verify/[certNumber]
 *
 * Retired: Green Freight Academy is the only public certificate-verification
 * authority. This endpoint intentionally does not reveal a driver record.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await params;

  if (!certNumber) {
    return NextResponse.json({ valid: false, authority: "gfa" }, { status: 400 });
  }

  return NextResponse.json(
    {
      valid: false,
      authority: "gfa",
      error: "Certificate verification is provided by Green Freight Academy.",
    },
    { status: 410 }
  );
}
