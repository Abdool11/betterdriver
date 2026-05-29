/**
 * Tests for GET /api/certificate/download
 * ════════════════════════════════════════════════════════════════════════════
 * Covers:
 *  - Unauthenticated request → 401
 *  - Certificate not found in DB → 404
 *  - Valid request → 200 with Content-Type: application/pdf
 *  - Falls back to bundled template when no custom template is set
 */

import { NextRequest } from "next/server";

// ── Mock BD auth ─────────────────────────────────────────────────────────────
const mockGetSession = jest.fn();
jest.mock("@/lib/auth", () => ({
  getSession: mockGetSession,
}));

// ── Build chainable Supabase mock ────────────────────────────────────────────
// The route uses: .from().select().eq().eq().eq().order().limit() → await
// and separately: .from().select().eq().single()
// and: .from().select().eq().single() (for settings)

type ChainResult = { data: unknown; count?: number | null; error: unknown };
type ChainResultFn = () => ChainResult;

function makeChain(resolveWith: ChainResultFn) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "order", "limit", "single", "in"];
  methods.forEach(m => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: (v: unknown) => void) =>
    Promise.resolve(resolveWith()).then(resolve);
  return chain;
}

// We need different tables to return different results
// Use a queue per table
const certQueue: ChainResultFn[] = [];
const driverQueue: ChainResultFn[] = [];
const settingsQueue: ChainResultFn[] = [];

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === "certifications") {
        return makeChain(() => certQueue.shift()?.() ?? { data: null, error: { message: "empty queue" } });
      }
      if (table === "drivers") {
        return makeChain(() => driverQueue.shift()?.() ?? { data: null, error: { message: "empty queue" } });
      }
      // settings
      return makeChain(() => settingsQueue.shift()?.() ?? { data: null, error: null });
    }),
  })),
}));

// ── Mock pdf-lib ──────────────────────────────────────────────────────────────
jest.mock("pdf-lib", () => ({
  PDFDocument: {
    create: jest.fn(async () => ({
      addPage: jest.fn(() => ({
        drawImage: jest.fn(),
        drawText: jest.fn(),
      })),
      embedPng: jest.fn(async () => ({})),
      embedFont: jest.fn(async () => ({
        widthOfTextAtSize: jest.fn(() => 100),
      })),
      save: jest.fn(async () => new Uint8Array([37, 80, 68, 70])), // %PDF magic bytes
    })),
  },
  StandardFonts: { HelveticaBold: "Helvetica-Bold", Helvetica: "Helvetica" },
  rgb: jest.fn(() => ({})),
}));

// ── Mock fs.readFileSync for the fallback template ───────────────────────────
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  readFileSync: jest.fn(() => Buffer.from("fake-png-bytes")),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET } = require("../app/api/certificate/download/route");

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/certificate/download");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

const MOCK_SESSION = { driverId: "driver-uuid-1", role: "driver" };
const MOCK_CERT = {
  id: "cert-uuid-1",
  certificate_number: "BD-20260529-ABCD1234",
  programme: "Program 1: The Professional Truck Driver",
  issued_at: "2026-05-29T10:00:00Z",
  status: "active",
  driver_id: "driver-uuid-1",
};
const MOCK_DRIVER = { first_name: "Sipho", last_name: "Dlamini" };

// ── Tests ────────────────────────────────────────────────────────────────────
describe("GET /api/certificate/download", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    certQueue.length = 0;
    driverQueue.length = 0;
    settingsQueue.length = 0;
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 404 when no certificate exists for the driver", async () => {
    mockGetSession.mockResolvedValueOnce(MOCK_SESSION);
    certQueue.push(() => ({ data: [], error: null }));

    const res = await GET(makeRequest());
    expect(res.status).toBe(404);
  });

  it("returns 200 with PDF content-type for a valid request", async () => {
    mockGetSession.mockResolvedValueOnce(MOCK_SESSION);
    certQueue.push(() => ({ data: [MOCK_CERT], error: null }));
    driverQueue.push(() => ({ data: MOCK_DRIVER, error: null }));
    // No custom template in settings
    settingsQueue.push(() => ({ data: null, error: null })); // template_url
    settingsQueue.push(() => ({ data: null, error: null })); // text_positions

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain(".pdf");
  });

  it("uses the fallback bundled template when no custom template is set", async () => {
    const fs = jest.requireMock("fs");
    mockGetSession.mockResolvedValueOnce(MOCK_SESSION);
    certQueue.push(() => ({ data: [MOCK_CERT], error: null }));
    driverQueue.push(() => ({ data: MOCK_DRIVER, error: null }));
    settingsQueue.push(() => ({ data: { value: "" }, error: null })); // empty template URL
    settingsQueue.push(() => ({ data: null, error: null }));

    const res = await GET(makeRequest());
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("certificate-bg.png"),
    );
    expect(res.status).toBe(200);
  });

  it("fetches a specific cert by id when certId param is provided", async () => {
    mockGetSession.mockResolvedValueOnce(MOCK_SESSION);
    certQueue.push(() => ({ data: [MOCK_CERT], error: null }));
    driverQueue.push(() => ({ data: MOCK_DRIVER, error: null }));
    settingsQueue.push(() => ({ data: null, error: null }));
    settingsQueue.push(() => ({ data: null, error: null }));

    const res = await GET(makeRequest({ id: "cert-uuid-1" }));
    expect(res.status).toBe(200);
  });
});
