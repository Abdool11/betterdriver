import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { moodleGetProgress, moodleGetCourseModules, normalizeProgrammeSlug } from "@/lib/moodle";
import { ensureCertificate } from "@/lib/certificate";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/certificate
 *
 * Returns the driver's certificate details. If the driver has completed the
 * programme but no certificate record exists yet, one is created automatically.
 * This endpoint is more reliable than deriving the certificate from the
 * dashboard because it queries enrolments regardless of status.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch driver
  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, first_name, last_name, company_id, moodle_user_id")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver) {
    console.error("[CERTIFICATE_API] Driver not found:", driverErr?.message);
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  // 2. Fetch the most recent enrolment for this driver (any status)
  const { data: enrolment } = await supabaseAdmin
    .from("enrolments")
    .select("id, programme_slug, status, progress_percent, modules_completed, completed_at")
    .eq("driver_id", session.driverId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrolment) {
    return NextResponse.json({
      isComplete: false,
      certificateNumber: null,
      certificateIssuedAt: null,
      programmeTitle: "The Professional Truck Driver Programme",
    });
  }

  const canonicalSlug = normalizeProgrammeSlug(enrolment.programme_slug ?? "ptdp");
  const programmeTitle =
    canonicalSlug === "professional-truck-driver"
      ? "The Professional Truck Driver Programme"
      : "Eco-Driver Training";

  // 3. Determine completion from Supabase + live Moodle data
  let completedModules = enrolment.modules_completed ?? 0;
  let totalModules = 0;
  let courseCompleted = false;

  if (driver.moodle_user_id) {
    try {
      const progress = await moodleGetProgress({
        moodleUserId: driver.moodle_user_id,
        programmeSlug: canonicalSlug,
      });
      const moodleModules = await moodleGetCourseModules({
        moodleUserId: driver.moodle_user_id,
        programmeSlug: canonicalSlug,
      });

      totalModules = moodleModules.length > 0 ? moodleModules.length : progress.totalmodules;
      completedModules = Math.max(progress.completedmodules, completedModules);
      courseCompleted =
        progress.completed || (totalModules > 0 && completedModules >= totalModules) || !!enrolment.completed_at;
    } catch (err) {
      console.error("[CERTIFICATE_API] Moodle fetch failed:", err);
      courseCompleted = !!enrolment.completed_at || (enrolment.progress_percent ?? 0) >= 100;
    }
  } else {
    courseCompleted = !!enrolment.completed_at || (enrolment.progress_percent ?? 0) >= 100;
  }

  // 4. Ensure a certificate exists if the course is complete
  let certificateNumber: string | null = null;
  let certificateIssuedAt: string | null = null;

  if (courseCompleted) {
    console.log("[CERTIFICATE_API] Course complete, ensuring certificate for driver", session.driverId);
    const cert = await ensureCertificate({
      driverId: session.driverId,
      enrolmentId: enrolment.id,
      companyId: driver.company_id ?? null,
      programme: canonicalSlug === "professional-truck-driver" ? "p1" : "p2",
      enrolmentSlug: canonicalSlug,
    });

    if (cert) {
      certificateNumber = cert.certificate_number;
      certificateIssuedAt = cert.issued_at;
    } else {
      console.error("[CERTIFICATE_API] ensureCertificate returned null");
    }
  }

  return NextResponse.json({
    isComplete: courseCompleted,
    certificateNumber,
    certificateIssuedAt,
    programmeTitle,
    driverName: `${driver.first_name ?? ""} ${driver.last_name ?? ""}`.trim() || "Driver",
  });
}
