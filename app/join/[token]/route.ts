import { NextRequest, NextResponse } from "next/server";

/**
 * Canonical public driver-entry route.
 *
 * GFA issues BetterDriver links as /join/{opaque-token}. Keeping this route
 * explicit avoids reliance on infrastructure-only rewrites and forwards the
 * request to the existing invitation resolver at /api/join/{token}.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const target = new URL(`/api/join/${encodeURIComponent(token)}`, req.url);
  return NextResponse.redirect(target);
}
