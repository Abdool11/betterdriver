/**
 * Tests for POST /api/moodle/webhook — certificate auto-generation section
 * ════════════════════════════════════════════════════════════════════════════
 * Covers:
 *  - Missing / wrong MOODLE_WEBHOOK_SECRET → 401
 *  - programme_complete event → certifications row upserted
 *  - Already-completed enrolment → upsert NOT called (idempotent)
 *  - module_complete event (not fully complete) → cert NOT inserted
 *  - Driver not found → graceful 200 no-op
 *  - WhatsApp notification fired after cert insert
 *  - Certificate number matches BD-YYYYMMDD-XXXXXXXX format
 */

import { NextRequest } from "next/server";

// ── Environment ──────────────────────────────────────────────────────────────
// The COURSE_ID_TO_SLUG map in the route uses these env vars.
// Set them before requiring the route so the map is populated.
process.env.MOODLE_WEBHOOK_SECRET = "test-secret-abc";
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy-service-key";
process.env.MOODLE_DRIVER_PROGRAMME_COURSE_ID = "5";
process.env.MOODLE_ECO_DRIVER_COURSE_ID = "6";

// ── Mock WhatsApp ─────────────────────────────────────────────────────────────
const mockSendWhatsApp = jest.fn().mockResolvedValue(true);
jest.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: mockSendWhatsApp,
  sendProgrammeCompleteWhatsApp: mockSendWhatsApp,
}));

// ── Mock Moodle progress ──────────────────────────────────────────────────────
const mockMoodleGetProgress = jest.fn().mockResolvedValue({
  completed: true,
  progressPercent: 100,
  completedmodules: 8,
});
jest.mock("@/lib/moodle", () => ({
  moodleGetProgress: (...args: unknown[]) => mockMoodleGetProgress(...args),
  MOODLE_COURSE_IDS: { DRIVER_PROGRAMME: 5, ECO_DRIVER: 6 },
}));

// ── Supabase mock ────────────────────────────────────────────────────────────
const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockResolvedValue({ error: null });
const mockDriverSingle = jest.fn();
const mockEnrolmentSingle = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === "drivers") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: mockDriverSingle,
        };
      }
      if (table === "enrolments") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: mockEnrolmentSingle,
          update: jest.fn(() => ({ eq: mockUpdate })),
        };
      }
      if (table === "certifications") {
        return { upsert: mockUpsert };
      }
      // fallback
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST } = require("../app/api/moodle/webhook/route");

// ── Helpers ──────────────────────────────────────────────────────────────────
// The Moodle webhook uses the native Moodle payload shape:
// { userid, courseid, completionstate, event }
function makeWebhookRequest(body: Record<string, unknown>, secret = "test-secret-abc") {
  return new NextRequest("http://localhost/api/moodle/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-moodle-secret": secret,
    },
    body: JSON.stringify(body),
  });
}

const MOCK_DRIVER = {
  id: "driver-uuid-1",
  first_name: "Sipho",
  last_name: "Dlamini",
  mobile: "+27821234567",
  language_preference: "en",
  moodle_user_id: 42,
};

const MOCK_ENROLMENT_INCOMPLETE = {
  id: "enrolment-uuid-1",
  completed_at: null, // not yet complete — this is a new completion
  modules_completed: 7,
};

const MOCK_ENROLMENT_COMPLETE = {
  id: "enrolment-uuid-1",
  completed_at: "2026-05-01T10:00:00Z", // already completed
  modules_completed: 8,
};

// Moodle native payload for a programme completion event on course 5
const PROGRAMME_COMPLETE_PAYLOAD = {
  userid: 42,
  courseid: 5,
  completionstate: 1,
  event: "\\core\\event\\course_module_completion_updated",
};

// ── Tests ────────────────────────────────────────────────────────────════════
describe("POST /api/moodle/webhook — certificate auto-generation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMoodleGetProgress.mockResolvedValue({
      completed: true,
      progressPercent: 100,
      completedmodules: 8,
    });
  });

  it("returns 401 when webhook secret is missing", async () => {
    const res = await POST(makeWebhookRequest(PROGRAMME_COMPLETE_PAYLOAD, ""));
    expect(res.status).toBe(401);
  });

  it("returns 401 when webhook secret is wrong", async () => {
    const res = await POST(makeWebhookRequest(PROGRAMME_COMPLETE_PAYLOAD, "wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("inserts a certification record on programme_complete", async () => {
    mockDriverSingle.mockResolvedValueOnce({ data: MOCK_DRIVER, error: null });
    mockEnrolmentSingle.mockResolvedValueOnce({ data: MOCK_ENROLMENT_INCOMPLETE, error: null });

    const res = await POST(makeWebhookRequest(PROGRAMME_COMPLETE_PAYLOAD));

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.driver_id).toBe("driver-uuid-1");
    expect(upsertCall.status).toBe("active");
    expect(upsertCall.programme).toContain("Professional Truck Driver");
    // Certificate number format: BD-YYYYMMDD-XXXXXXXX
    expect(upsertCall.certificate_number).toMatch(/^BD-\d{8}-[A-Z0-9]{8}$/);
  });

  it("does NOT insert a cert when enrolment is already completed (idempotent)", async () => {
    mockDriverSingle.mockResolvedValueOnce({ data: MOCK_DRIVER, error: null });
    mockEnrolmentSingle.mockResolvedValueOnce({ data: MOCK_ENROLMENT_COMPLETE, error: null });

    const res = await POST(makeWebhookRequest(PROGRAMME_COMPLETE_PAYLOAD));

    expect(res.status).toBe(200);
    // isNowComplete is false because completed_at is already set
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("fires a WhatsApp notification after cert insert", async () => {
    mockDriverSingle.mockResolvedValueOnce({ data: MOCK_DRIVER, error: null });
    mockEnrolmentSingle.mockResolvedValueOnce({ data: MOCK_ENROLMENT_INCOMPLETE, error: null });

    await POST(makeWebhookRequest(PROGRAMME_COMPLETE_PAYLOAD));

    expect(mockSendWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({
        to: MOCK_DRIVER.mobile,
        templateName: "bd_programme_complete",
      }),
    );
  });

  it("does NOT insert a cert when progress is not yet complete", async () => {
    mockDriverSingle.mockResolvedValueOnce({ data: MOCK_DRIVER, error: null });
    mockEnrolmentSingle.mockResolvedValueOnce({ data: MOCK_ENROLMENT_INCOMPLETE, error: null });
    // Override progress to not-complete
    mockMoodleGetProgress.mockResolvedValueOnce({
      completed: false,
      progressPercent: 50,
      completedmodules: 4,
    });

    const res = await POST(makeWebhookRequest(PROGRAMME_COMPLETE_PAYLOAD));

    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 200 even when driver is not found (graceful no-op)", async () => {
    mockDriverSingle.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

    const res = await POST(makeWebhookRequest(PROGRAMME_COMPLETE_PAYLOAD));

    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("skips silently when courseid is not a tracked course", async () => {
    const res = await POST(makeWebhookRequest({ ...PROGRAMME_COMPLETE_PAYLOAD, courseid: 999 }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.skipped).toBe("unknown course");
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
