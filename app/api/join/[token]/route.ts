import { NextRequest, NextResponse } from "next/server";
import { resolveInvitationToken, createSession } from "@/lib/auth";

// GET /api/join/[token]
// The magic link handler. Driver taps /join/a7x92kp4 → this route resolves
// the opaque token, issues a 30-day JWT session cookie, and redirects to portal.
// No password. No OTP. No friction.
//
// First-access flow:
//   1. No language set → /portal/language (choose EN or ZU)
//   2. Language set    → /portal/welcome  (invite video + name)
//   3. Returning       → /portal          (straight to dashboard)

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

  if (result.isFirstAccess) {
    // Build the video param once (used by both language and welcome pages)
    const videoParam = result.inviteVideoUrl
      ? `?video=${encodeURIComponent(result.inviteVideoUrl)}`
      : "";

    if (!result.languagePreference) {
      // Driver has not chosen a language yet — show language selection first
      return NextResponse.redirect(new URL(`/portal/language${videoParam}`, req.url));
    }

    // Language already set — go straight to welcome with invite video
    return NextResponse.redirect(new URL(`/portal/welcome${videoParam}`, req.url));
  }

  // Returning driver — go straight to portal home
  return NextResponse.redirect(new URL("/portal", req.url));
}
