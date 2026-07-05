import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withMoodleToken } from "./moodle";

describe("withMoodleToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      MOODLE_URL: "https://learning.transportactiongroup.com",
      MOODLE_TOKEN: "service-token",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("preserves an existing token from Moodle", () => {
    const url = withMoodleToken(
      "https://learning.transportactiongroup.com/webservice/pluginfile.php/123/mod_resource/content/0/video.mp4?token=moodle-user-token&forcedownload=1"
    );
    expect(url).toContain("token=moodle-user-token");
    expect(url).not.toContain("token=service-token");
    expect(url).toContain("forcedownload=1");
  });

  it("adds the service token when the URL has no token", () => {
    const url = withMoodleToken(
      "https://learning.transportactiongroup.com/webservice/pluginfile.php/123/mod_resource/content/0/video.mp4?forcedownload=1"
    );
    expect(url).toContain("token=service-token");
    expect(url).toContain("forcedownload=1");
  });

  it("throws if no token exists and MOODLE_TOKEN is not configured", async () => {
    delete process.env.MOODLE_TOKEN;
    vi.resetModules();
    const { withMoodleToken: freshWithMoodleToken } = await import("./moodle");
    expect(() =>
      freshWithMoodleToken(
        "https://learning.transportactiongroup.com/webservice/pluginfile.php/123/mod_resource/content/0/video.mp4?forcedownload=1"
      )
    ).toThrow();
  });
});
