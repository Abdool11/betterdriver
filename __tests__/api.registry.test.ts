/**
 * Tests for GET /api/registry
 * ════════════════════════════════════════════════════════════════════════════
 * Covers:
 *  - Empty result set (no query, no data)
 *  - Search by driver name returns results with correct shape
 *  - Partial ID masking (only last 4 digits visible)
 *  - Supabase error → 500 response
 *  - Null driver (orphaned cert) → "Unknown Driver" fallback
 */

import { NextRequest } from "next/server";

// ── Build a chainable Supabase mock ──────────────────────────────────────────
// The registry route calls: .from().select().eq().order().range() and optionally .or()/.ilike()
// We need the final resolution to return our mock data.

let certQueryResult: { data: unknown[]; count: number | null; error: unknown } = {
  data: [],
  count: 0,
  error: null,
};
let driverQueryResult: { data: unknown[]; error: unknown } = { data: [], error: null };

// A chainable mock that resolves when awaited
function makeChain(resolveWith: () => { data: unknown; count?: number | null; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "order", "range", "or", "ilike", "in"];
  methods.forEach(m => {
    chain[m] = jest.fn(() => chain);
  });
  // Make the chain thenable so `await certQuery` works
  chain.then = (resolve: (v: unknown) => void, _reject: unknown) => {
    return Promise.resolve(resolveWith()).then(resolve);
  };
  return chain;
}

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === "drivers") {
        return makeChain(() => driverQueryResult);
      }
      return makeChain(() => certQueryResult);
    }),
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET } = require("../app/api/registry/route");

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/registry");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("GET /api/registry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    certQueryResult = { data: [], count: 0, error: null };
    driverQueryResult = { data: [], error: null };
  });

  it("returns empty results when no data exists", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.totalPages).toBe(0);
  });

  it("returns paginated results with correct shape", async () => {
    certQueryResult = {
      data: [
        {
          id: "cert-uuid-1",
          certificate_number: "BD-20260529-ABCD1234",
          programme: "Program 1: The Professional Truck Driver",
          issued_at: "2026-05-29T10:00:00Z",
          status: "active",
          driver_id: "driver-uuid-1",
          drivers: { first_name: "Sipho", last_name: "Dlamini", id_number: "9001015009087" },
        },
      ],
      count: 1,
      error: null,
    };

    const res = await GET(makeRequest({ page: "1", limit: "10" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].driverName).toBe("Sipho Dlamini");
    expect(body.results[0].certificateNumber).toBe("BD-20260529-ABCD1234");
    expect(body.results[0].programme).toBe("Program 1: The Professional Truck Driver");
    expect(body.results[0].verificationUrl).toContain("/verify/BD-20260529-ABCD1234");
    expect(body.total).toBe(1);
    expect(body.totalPages).toBe(1);
  });

  it("masks ID number — only last 4 digits visible", async () => {
    certQueryResult = {
      data: [
        {
          id: "cert-uuid-2",
          certificate_number: "BD-20260529-XXXX0001",
          programme: "Program 2: Eco-Driving Mastery",
          issued_at: "2026-05-29T10:00:00Z",
          status: "active",
          driver_id: "driver-uuid-2",
          drivers: { first_name: "Thabo", last_name: "Mokoena", id_number: "8505125009087" },
        },
      ],
      count: 1,
      error: null,
    };

    const res = await GET(makeRequest());
    const body = await res.json();

    const idNumber: string = body.results[0].idNumber;
    // Should not contain the full ID
    expect(idNumber).not.toBe("8505125009087");
    // Should end with the last 4 digits
    expect(idNumber).toContain("9087");
    // Should mask the rest with bullet characters (•)
    expect(idNumber).toMatch(/•+9087/);
  });

  it("returns 500 when Supabase throws an error", async () => {
    certQueryResult = {
      data: [],
      count: null,
      error: { message: "connection refused" },
    };

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("handles null driver gracefully (orphaned cert)", async () => {
    certQueryResult = {
      data: [
        {
          id: "cert-uuid-3",
          certificate_number: "BD-20260529-ORPHAN01",
          programme: "Program 1: The Professional Truck Driver",
          issued_at: "2026-05-29T10:00:00Z",
          status: "active",
          driver_id: "driver-uuid-3",
          drivers: null,
        },
      ],
      count: 1,
      error: null,
    };

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results[0].driverName).toBe("Unknown Driver");
    expect(body.results[0].idNumber).toBe("••••••••••••••");
  });

  it("applies default limit and page when params are missing", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(1);
  });
});
