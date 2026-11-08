import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/portal/certificate/download
 *
 * Deprecated deliberately: official certificate PDFs are generated and delivered
 * by Green Freight Academy. BetterDriver must not create a competing document.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(
    {
      error: "Official certificate PDFs are managed by Green Freight Academy.",
      authority: "gfa",
      message: "The secure GFA driver certificate handoff is being configured.",
    },
    { status: 410 }
  );
}
