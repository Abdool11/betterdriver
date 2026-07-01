import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/portal/certificate — fetch the driver's active certificate, auto-create if eligible
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch driver info
  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, full_name, email")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  // Check for an existing active certification
  const { data: existingCert } = await supabaseAdmin
    .from("certifications")
    .select(`
      id, certificate_number, programme, issued_at, expires_at, status, pdf_url,
      enrolment_id, course_id
    `)
    .eq("driver_id", session.driverId)
    .eq("status", "active")
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingCert) {
    // Fetch programme name from courses table
    let programmeName = "The Professional Truck Driver Programme";
    if (existingCert.course_id) {
      const { data: course } = await supabaseAdmin
        .from("courses")
        .select("name")
        .eq("id", existingCert.course_id)
        .maybeSingle();
      if (course?.name) programmeName = course.name;
    }

    return NextResponse.json({
      certificate: {
        id: existingCert.id,
        certificateNumber: existingCert.certificate_number,
        programmeName,
        programme: existingCert.programme,
        issuedAt: existingCert.issued_at,
        expiresAt: existingCert.expires_at,
        status: existingCert.status,
        verificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://betterdriver.co.za"}/registry?cert=${existingCert.certificate_number}`,
      },
      driver: {
        name: driver.full_name,
      },
    });
  }

  // No existing certificate — check if the driver has a completed enrolment
  const { data: enrolment } = await supabaseAdmin
    .from("enrolments")
    .select("id, course_id, programme_slug, completed_at, status")
    .eq("driver_id", session.driverId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrolment || !enrolment.completed_at) {
    return NextResponse.json({
      certificate: null,
      driver: { name: driver.full_name },
      message: "Course not yet completed",
    });
  }

  // Fetch course name
  let programmeName = "The Professional Truck Driver Programme";
  let programmeSlug = "p1";
  if (enrolment.course_id) {
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("name, programme, slug")
      .eq("id", enrolment.course_id)
      .maybeSingle();
    if (course?.name) programmeName = course.name;
    if (course?.programme) programmeSlug = course.programme;
  } else if (enrolment.programme_slug) {
    programmeSlug = enrolment.programme_slug === "eco-driver" ? "p2" : "p1";
    programmeName = enrolment.programme_slug === "eco-driver"
      ? "Eco-Driving Mastery"
      : "The Professional Truck Driver Programme";
  }

  // Generate a unique certificate number: BD-YYYY-NNNNN
  const year = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from("certifications")
    .select("id", { count: "exact", head: true });

  const seqNum = String((count ?? 0) + 1).padStart(5, "0");
  const certificateNumber = `BD-${year}-${seqNum}`;

  // Create the certification record
  const { data: newCert, error: certErr } = await supabaseAdmin
    .from("certifications")
    .insert({
      driver_id: session.driverId,
      enrolment_id: enrolment.id,
      course_id: enrolment.course_id,
      certificate_number: certificateNumber,
      programme: programmeSlug,
      issued_at: enrolment.completed_at,
      status: "active",
    })
    .select("id, certificate_number, programme, issued_at, expires_at, status")
    .single();

  if (certErr || !newCert) {
    console.error("[CERTIFICATE] Failed to create certification:", certErr?.message);
    return NextResponse.json({ error: "Failed to create certificate" }, { status: 500 });
  }

  // Mark enrolment as certified
  await supabaseAdmin
    .from("enrolments")
    .update({ status: "certified", certified: true, certified_at: new Date().toISOString() })
    .eq("id", enrolment.id);

  return NextResponse.json({
    certificate: {
      id: newCert.id,
      certificateNumber: newCert.certificate_number,
      programmeName,
      programme: newCert.programme,
      issuedAt: newCert.issued_at,
      expiresAt: newCert.expires_at,
      status: newCert.status,
      verificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://betterdriver.co.za"}/registry?cert=${newCert.certificate_number}`,
    },
    driver: {
      name: driver.full_name,
    },
  });
}
