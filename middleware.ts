import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.BD_JWT_SECRET ?? process.env.JWT_SECRET ?? "bd-dev-secret-change-in-production"
);

const COOKIE_NAME = "bd_session";

async function verifyToken(token: string): Promise<{ role?: string; driverId?: string; adminId?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { role?: string; driverId?: string; adminId?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Portal routes — require driver session ────────────────────────────────
  if (pathname.startsWith("/portal")) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/start", req.url));
    }
    const session = await verifyToken(token);
    if (!session || !session.driverId) {
      return NextResponse.redirect(new URL("/start", req.url));
    }
    return NextResponse.next();
  }

  // ── Admin routes — require admin session ──────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    const session = await verifyToken(token);
    if (!session || !session.adminId) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
