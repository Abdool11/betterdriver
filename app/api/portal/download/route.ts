import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import {
  moodleGetCourseModules,
  normalizeProgrammeSlug,
  pickMoodleDownloadFile,
  getBunnyVideoUrl,
  withMoodleToken,
} from "@/lib/moodle";

export const dynamic = "force-dynamic";

function sanitizeFilename(name: string): string {
  // Remove characters that break Content-Disposition parsing
  return name.replace(/[\\"]/g, "");
}

function setAttachmentHeaders(
  headers: Headers,
  upstreamContentType: string | null,
  contentLength: string | null,
  filename: string
) {
  // Browsers sometimes display text/html or text/plain inline even when the
  // anchor has a download attribute. Force binary content type for renderable
  // text types so the file is saved rather than shown as code.
  const renderable = upstreamContentType
    ? /\/(html|xhtml|xml|javascript|ecmascript|json|plain|css)$/i.test(upstreamContentType) ||
      upstreamContentType.startsWith("text/")
    : false;
  headers.set(
    "Content-Type",
    renderable ? "application/octet-stream" : (upstreamContentType ?? "application/octet-stream")
  );
  headers.set("X-Content-Type-Options", "nosniff");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }
  headers.set("Content-Disposition", `attachment; filename="${sanitizeFilename(filename)}"`);
}

/**
 * GET /api/portal/download?moduleId={id}
 * Proxies a Moodle course file for the authenticated driver so the browser can
 * download the actual video/document to the device without exposing the raw
 * Moodle pluginfile token in the client.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get("moduleId");
  if (!moduleId) {
    return NextResponse.json(
      { error: "Missing moduleId parameter" },
      { status: 400 }
    );
  }

  // Fetch driver and active enrolment
  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, moodle_user_id")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  if (!driver.moodle_user_id) {
    return NextResponse.json(
      { error: "Your account is not linked to Moodle yet" },
      { status: 400 }
    );
  }

  const { data: enrolment } = await supabaseAdmin
    .from("enrolments")
    .select("programme_slug, status")
    .eq("driver_id", session.driverId)
    .in("status", ACTIVE_ENROLMENT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const programmeSlug = enrolment?.programme_slug ?? "ptdp";
  const canonicalSlug = normalizeProgrammeSlug(programmeSlug);

  // Fetch modules from Moodle and find the requested one
  let modules: Awaited<ReturnType<typeof moodleGetCourseModules>> = [];
  try {
    modules = await moodleGetCourseModules({
      moodleUserId: driver.moodle_user_id,
      programmeSlug: canonicalSlug,
    });
  } catch (err) {
    console.error("[DOWNLOAD] Moodle fetch failed:", err);
    return NextResponse.json(
      { error: "Unable to load course content from Moodle" },
      { status: 502 }
    );
  }

  const mod = modules.find((m) => String(m.id) === moduleId);
  if (!mod) {
    return NextResponse.json(
      { error: "Module not found in your programme" },
      { status: 404 }
    );
  }

  const file = pickMoodleDownloadFile(mod.files);

  // ── Option A: Moodle-attached file ────────────────────────────────────────
  if (file?.fileurl) {
    try {
      const fileRes = await fetch(withMoodleToken(file.fileurl));
      if (!fileRes.ok) {
        console.error(
          "[DOWNLOAD] Moodle file fetch failed:",
          fileRes.status,
          fileRes.statusText,
          file.fileurl
        );
        return NextResponse.json(
          { error: "Unable to fetch the file from Moodle" },
          { status: 502 }
        );
      }

      const headers = new Headers();
      setAttachmentHeaders(
        headers,
        fileRes.headers.get("content-type"),
        fileRes.headers.get("content-length"),
        file.filename
      );

      return new Response(fileRes.body, {
        status: 200,
        headers,
      });
    } catch (err) {
      console.error("[DOWNLOAD] File proxy failed:", err);
      return NextResponse.json(
        { error: "Failed to download the file" },
        { status: 502 }
      );
    }
  }

  // ── Option B: Bunny Stream embedded video ─────────────────────────────────
  if (mod.bunnyVideoId) {
    const bunnyUrl = getBunnyVideoUrl(mod.bunnyVideoId);
    const filename = `${mod.name.replace(/[^a-zA-Z0-9\s]/g, "").trim()}.mp4`;

    try {
      const bunnyRes = await fetch(bunnyUrl, {
        headers: { Referer: "https://iframe.mediadelivery.net/" },
      });
      if (!bunnyRes.ok) {
        console.error(
          "[DOWNLOAD] Bunny CDN fetch failed:",
          bunnyRes.status,
          bunnyRes.statusText,
          bunnyUrl
        );
        return NextResponse.json(
          { error: "Unable to fetch the video from the CDN" },
          { status: 502 }
        );
      }

      const headers = new Headers();
      setAttachmentHeaders(
        headers,
        bunnyRes.headers.get("content-type"),
        bunnyRes.headers.get("content-length"),
        filename
      );

      return new Response(bunnyRes.body, {
        status: 200,
        headers,
      });
    } catch (err) {
      console.error("[DOWNLOAD] Bunny proxy failed:", err);
      return NextResponse.json(
        { error: "Failed to download the video" },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(
    { error: "No downloadable content for this module" },
    { status: 404 }
  );
}
