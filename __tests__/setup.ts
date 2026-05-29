/**
 * Jest global setup for BD API route tests.
 * Mocks Next.js server-only modules that cannot run outside the Next.js runtime.
 */

// ── Mock next/headers (cookies) ──────────────────────────────────────────────
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => undefined),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// ── Mock next/server (NextRequest / NextResponse) ────────────────────────────
// We use the real NextResponse where possible; this ensures JSON helpers work.
jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server");
  return { ...actual };
});

// ── Suppress console.error noise in test output ──────────────────────────────
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
