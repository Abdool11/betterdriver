import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/portal/certificate
 *
 * BetterDriver deliberately does not issue, number, verify or host professional
 * certificates. Green Freight Academy is the authoritative certificate service.
 * This retained endpoint prevents legacy clients from creating a local certificate
 * while the approved GFA driver handoff is being implemented.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    certificate: null,
    authority: "gfa",
    message: "Official certificates and verification are managed by Green Freight Academy. The secure driver handoff is being configured.",
  });
}
