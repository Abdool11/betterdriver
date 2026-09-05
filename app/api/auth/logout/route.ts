import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Clears the driver session cookie and returns a redirect URL.
 */
export async function POST(req: NextRequest) {
  await clearSession();
  return NextResponse.json({ ok: true, redirect: "/" });
}
