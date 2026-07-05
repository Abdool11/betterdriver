import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/moodle", async () => {
  const actual = await vi.importActual<typeof import("@/lib/moodle")>("@/lib/moodle");
  return {
    ...actual,
    moodleGetCourseModules: vi.fn(),
  };
});

import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { moodleGetCourseModules } from "@/lib/moodle";
import { GET } from "./route";

describe("GET /api/portal/download", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      MOODLE_URL: "https://learning.transportactiongroup.com",
      MOODLE_TOKEN: "service-token",
    };

    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      driverId: "driver-123",
    });

    const single = vi.fn().mockResolvedValue({
      data: { id: "driver-123", moodle_user_id: 42 },
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { programme_slug: "ptdp", status: "active" },
      error: null,
    });
    const orderMock = vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({ maybeSingle }),
    });
    const inMock = vi.fn().mockReturnValue({ order: orderMock });
    const eqMock = vi.fn().mockReturnValue({ single, in: inMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

    const enrolmentSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({ maybeSingle }),
          }),
        }),
      }),
    });

    (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "drivers") {
        return { select: selectMock };
      }
      if (table === "enrolments") {
        return { select: enrolmentSelectMock };
      }
      return {};
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockModule = () =>
    (moodleGetCourseModules as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 1,
        name: "Test Module",
        modname: "resource",
        instance: 1,
        completionstate: 0,
        files: [
          {
            type: "file",
            filename: "video.mp4",
            fileurl:
              "https://learning.transportactiongroup.com/webservice/pluginfile.php/123/mod_resource/content/0/video.mp4?forcedownload=1",
            filesize: 1024,
            mimetype: "video/mp4",
          },
        ],
      },
    ]);

  it("returns 502 instead of saving a Moodle JSON error as a file", async () => {
    mockModule();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      text: async () =>
        JSON.stringify({
          error: "A required parameter (token) was missing",
          errorcode: "missingparam",
        }),
    });

    const req = new NextRequest(
      "http://localhost:3000/api/portal/download?moduleId=1"
    );
    const res = await GET(req);

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Unable to fetch the file from Moodle");
  });

  it("proxies the file when Moodle returns a valid video response", async () => {
    mockModule();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("fake video bytes"));
        controller.close();
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "video/mp4",
        "content-length": "16",
      }),
      body: stream,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/portal/download?moduleId=1"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("video/mp4");
    expect(res.headers.get("content-disposition")).toContain("video.mp4");
  });
});
