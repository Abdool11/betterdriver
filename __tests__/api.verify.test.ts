/**
 * Tests for GET /api/verify/[certNumber]
 * ════════════════════════════════════════════════════════════════════════════
 * Covers:
 *  - Valid active certificate → { valid: true, driverName, programme, ... }
 *  - Revoked certificate → { valid: false, status: "revoked", revokedAt }
 *  - Certificate not found → 404 { valid: false, error: "Certificate not found" }
 *  - Missing certNumber param → 400
 *  - Case-insensitive lookup (lowercase input → uppercase stored)
 *  - Supabase error → 404 (treated as not found)
 */

import { NextRequest } from "next/server";

// ── Supabase mock ────────────────────────────────────────────────────────────
const mockSingle = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: mockSingle,
    })),
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET } = require("../app/api/verify/[certNumber]/route");

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(certNumber: string) {
  const url = new URL(`http://localhost/api/verify/${certNumber}`);
  return new NextRequest(url.toString());
}

function makeParams(certNumber: string) {
  return { params: { certNumber } };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("GET /api/verify/[certNumber]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns valid: true for an active certificate", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "cert-uuid-1",
        certificate_number: "BD-20260529-ABCD1234",
        programme: "Program 1: The Professional Truck Driver",
        issued_at: "2026-05-29T10:00:00Z",
        status: "active",
        revoked_at: null,
        drivers: { first_name: "Sipho", last_name: "Dlamini" },
      },
      error: null,
    });

    const res = await GET(makeRequest("BD-20260529-ABCD1234"), makeParams("BD-20260529-ABCD1234"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.valid).toBe(true);
    expect(body.driverName).toBe("Sipho Dlamini");
    expect(body.programme).toBe("Program 1: The Professional Truck Driver");
    expect(body.certificateNumber).toBe("BD-20260529-ABCD1234");
    expect(body.status).toBe("active");
  });

  it("returns valid: false with status revoked for a revoked certificate", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "cert-uuid-2",
        certificate_number: "BD-20260101-REVOKED1",
        programme: "Program 2: Eco-Driving Mastery",
        issued_at: "2026-01-01T10:00:00Z",
        status: "revoked",
        revoked_at: "2026-03-15T08:00:00Z",
        drivers: { first_name: "Thabo", last_name: "Mokoena" },
      },
      error: null,
    });

    const res = await GET(makeRequest("BD-20260101-REVOKED1"), makeParams("BD-20260101-REVOKED1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.valid).toBe(false);
    expect(body.status).toBe("revoked");
    expect(body.revokedAt).toBe("2026-03-15T08:00:00Z");
    expect(body.certificateNumber).toBe("BD-20260101-REVOKED1");
  });

  it("returns 404 when certificate is not found", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "No rows found" } });

    const res = await GET(makeRequest("BD-00000000-NOTFOUND"), makeParams("BD-00000000-NOTFOUND"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.valid).toBe(false);
    expect(body.error).toBe("Certificate not found");
  });

  it("returns 400 when certNumber param is missing", async () => {
    const res = await GET(makeRequest(""), makeParams(""));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.valid).toBe(false);
  });

  it("uppercases the certNumber before querying", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "cert-uuid-3",
        certificate_number: "BD-20260529-LOWER123",
        programme: "Program 1: The Professional Truck Driver",
        issued_at: "2026-05-29T10:00:00Z",
        status: "active",
        revoked_at: null,
        drivers: { first_name: "Nomsa", last_name: "Khumalo" },
      },
      error: null,
    });

    // Pass lowercase — should still work
    const res = await GET(makeRequest("bd-20260529-lower123"), makeParams("bd-20260529-lower123"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.valid).toBe(true);
  });

  it("handles null driver gracefully (orphaned cert)", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "cert-uuid-4",
        certificate_number: "BD-20260529-ORPHAN01",
        programme: "Program 1: The Professional Truck Driver",
        issued_at: "2026-05-29T10:00:00Z",
        status: "active",
        revoked_at: null,
        drivers: null,
      },
      error: null,
    });

    const res = await GET(makeRequest("BD-20260529-ORPHAN01"), makeParams("BD-20260529-ORPHAN01"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.valid).toBe(true);
    expect(body.driverName).toBe("Unknown Driver");
  });
});
