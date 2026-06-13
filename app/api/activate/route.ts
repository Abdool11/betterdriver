import { NextRequest, NextResponse } from "next/server";

// Legacy GET /api/activate?token=... — redirects to the new /api/join/[token] route.
// Kept for backward compatibility with any existing WhatsApp links already sent.
// The new magic link format is /join/[token] — no password required.

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/start?error=missing-token", req.url));
  }
  return NextResponse.redirect(new URL(`/api/join/${encodeURIComponent(token)}`, req.url));
}

// POST is no longer used — password activation has been removed.
// Kept as a stub to avoid 404 errors from any cached clients.
export async function POST() {
  return NextResponse.json(
    { error: "Password activation is no longer required. Please use your magic link to sign in." },
    { status: 410 }
  );
}
