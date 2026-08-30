import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.BD_JWT_SECRET ?? process.env.JWT_SECRET ?? "bd-dev-secret-change-in-production"
);
const COOKIE_NAME = "bd_session";
const DRIVER_SESSION_SECONDS = 60 * 60 * 24 * 30;
const RENEWAL_WINDOW_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  role?: string;
  driverId?: string;
  adminId?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  [key: string]: unknown;
};

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

async function refreshDriverSession(response: NextResponse, payload: SessionPayload) {
  const secondsRemaining = Number(payload.exp ?? 0) - Math.floor(Date.now() / 1000);
  if (secondsRemaining > RENEWAL_WINDOW_SECONDS) return;

  // Do not copy JWT-managed claims into the newly signed session.
  const { exp: _exp, iat: _iat, nbf: _nbf, ...driver } = payload;
  const token = await new SignJWT(driver)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DRIVER_SESSION_SECONDS,
    path: "/",
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Portal routes require a driver session. Active sessions are renewed only
  // within the final seven days, giving returning drivers durable access.
  if (pathname.startsWith("/portal")) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.redirect(new URL("/start", req.url));

    const session = await verifyToken(token);
    if (!session || !session.driverId) {
      return NextResponse.redirect(new URL("/start", req.url));
    }

    const response = NextResponse.next();
    await refreshDriverSession(response, session);
    return response;
  }

  // Admin routes require an admin session. Driver-session renewal is never
  // applied to admin cookies.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
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
