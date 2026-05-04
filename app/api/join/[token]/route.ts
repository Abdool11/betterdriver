import { NextRequest, NextResponse } from "next/server";
import { resolveInvitationToken, createSession } from "@/lib/auth";

// GET /api/join/[token]
// The magic link handler. Driver taps /join/a7x92kp4 → this route resolves
// the opaque token, issues a 30-day JWT session cookie, and redirects to portal.
// No password. No OTP. No friction.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.redirect(new URL("/start?error=missing-token", req.url));
  }

  const result = await resolveInvitationToken(token);

  if ("error" in result) {
    const errorMap: Record<string, string> = {
      invalid: "invalid-link",
      revoked: "link-deactivated",
      expired: "link-expired",
    };
    const errorCode = errorMap[result.code] ?? "invalid-link";
    return NextResponse.redirect(new URL(`/start?error=${errorCode}`, req.url));
  }

  // Issue the 30-day rolling JWT session cookie
  await createSession(result.session);

  // On first access, redirect to welcome page with invite video if available
  if (result.isFirstAccess) {
    const welcomeUrl = new URL("/portal/welcome", req.url);
    if (result.inviteVideoUrl) {
      welcomeUrl.searchParams.set("video", encodeURIComponent(result.inviteVideoUrl));
    }
    return NextResponse.redirect(welcomeUrl);
  }

  // Returning driver — go straight to portal home
  return NextResponse.redirect(new URL("/portal", req.url));
}
