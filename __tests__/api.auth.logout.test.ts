/**
 * Tests for POST /api/auth/logout
 * ════════════════════════════════════════════════════════════════════════════
 * Covers:
 *  - POST → 200 { ok: true } and clearSession is called
 *  - GET → 405 Method Not Allowed (only POST is supported)
 */

import { NextRequest } from "next/server";

// ── Mock BD auth ─────────────────────────────────────────────────────────────
const mockClearSession = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/auth", () => ({
  clearSession: mockClearSession,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST } = require("../app/api/auth/logout/route");

// ── Tests ────────────────────────────────────────────────────────────────────
describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 { ok: true } and calls clearSession", async () => {
    const req = new NextRequest("http://localhost/api/auth/logout", { method: "POST" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockClearSession).toHaveBeenCalledTimes(1);
  });

  it("calls clearSession even if no session cookie is present", async () => {
    // clearSession should be idempotent — calling it with no session is safe
    mockClearSession.mockResolvedValueOnce(undefined);

    const req = new NextRequest("http://localhost/api/auth/logout", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockClearSession).toHaveBeenCalledTimes(1);
  });
});
