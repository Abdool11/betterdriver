import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { moodleGetProgress, moodleGetCourseModules, normalizeProgrammeSlug } from "@/lib/moodle";
import { ensureCertificate } from "@/lib/certificate";
import PDFDocument from "pdfkit";

/**
 * GET /api/portal/certificate/download
 * Returns the driver's certificate as a downloadable PDF.
 * If pdf_url exists in the DB, redirects to it.
 * Otherwise generates a branded PDF certificate on the fly.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let { data: cert } = await supabaseAdmin
    .from("certifications")
    .select("certificate_number, pdf_url, issued_at, programme, driver_id")
    .eq("driver_id", session.driverId)
    .eq("status", "active")
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If no certificate exists yet, try to create one on demand
  if (!cert) {
    console.log("[DOWNLOAD] No certificate found, attempting to create one for driver", session.driverId);

    const { data: driver } = await supabaseAdmin
      .from("drivers")
      .select("id, company_id, moodle_user_id")
      .eq("id", session.driverId)
      .single();

    const { data: enrolment } = await supabaseAdmin
      .from("enrolments")
      .select("id, programme_slug, completed_at, modules_completed, progress_percent")
      .eq("driver_id", session.driverId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let courseCompleted = !!enrolment?.completed_at || (enrolment?.progress_percent ?? 0) >= 100;

    if (driver?.moodle_user_id && enrolment) {
      try {
        const canonicalSlug = normalizeProgrammeSlug(enrolment.programme_slug ?? "ptdp");
        const progress = await moodleGetProgress({
          moodleUserId: driver.moodle_user_id,
          programmeSlug: canonicalSlug,
        });
        const moodleModules = await moodleGetCourseModules({
          moodleUserId: driver.moodle_user_id,
          programmeSlug: canonicalSlug,
        });
        const completedModules = Math.max(
          progress.completedmodules,
          enrolment.modules_completed ?? 0
        );
        const totalModules = moodleModules.length > 0 ? moodleModules.length : progress.totalmodules;
        courseCompleted =
          courseCompleted || progress.completed || (totalModules > 0 && completedModules >= totalModules);
      } catch (err) {
        console.error("[DOWNLOAD] Moodle completion check failed:", err);
      }
    }

    if (courseCompleted && enrolment) {
      const canonicalSlug = normalizeProgrammeSlug(enrolment.programme_slug ?? "ptdp");
      const newCert = await ensureCertificate({
        driverId: session.driverId,
        enrolmentId: enrolment.id,
        companyId: driver?.company_id ?? null,
        programme: canonicalSlug === "professional-truck-driver" ? "p1" : "p2",
        enrolmentSlug: canonicalSlug,
      });

      if (newCert) {
        cert = {
          certificate_number: newCert.certificate_number,
          pdf_url: null,
          issued_at: newCert.issued_at,
          programme: canonicalSlug === "professional-truck-driver" ? "p1" : "p2",
          driver_id: session.driverId,
        };
      }
    }
  }

  if (!cert) {
    return NextResponse.json({ error: "No certificate found" }, { status: 404 });
  }

  // If a pre-generated PDF exists, redirect to it
  if (cert.pdf_url) {
    return NextResponse.redirect(cert.pdf_url);
  }

  const { data: driver } = await supabaseAdmin
    .from("drivers")
    .select("first_name, last_name")
    .eq("id", session.driverId)
    .single();

  const driverName = `${driver?.first_name ?? ""} ${driver?.last_name ?? ""}`.trim() || "Driver";
  const programmeName =
    cert.programme === "p2" || cert.programme === "eco-driver"
      ? "Eco-Driver Training"
      : "The Professional Truck Driver Programme";

  const issuedDate = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // Generate PDF using pdfkit
  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
    margin: 0,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const pdfPromise = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Background — white with amber border
  doc.rect(0, 0, pageW, pageH).fillColor("#ffffff").fill();
  doc.rect(20, 20, pageW - 40, pageH - 40).fillColor("#ffffff").fill();
  doc.rect(20, 20, pageW - 40, pageH - 40).lineWidth(6).strokeColor("#f59e0b").stroke();
  doc.rect(30, 30, pageW - 60, pageH - 60).lineWidth(1).strokeColor("#f59e0b").stroke();

  // Logo / brand name
  doc.fontSize(24).fillColor("#f59e0b").font("Helvetica-Bold");
  doc.text("BetterDriver", 0, 60, { align: "center" });

  // Label
  doc.fontSize(11).fillColor("#64748b").font("Helvetica");
  doc.text("CERTIFICATE OF COMPLETION", 0, 95, { align: "center" });

  // Programme name
  doc.fontSize(28).fillColor("#0a1628").font("Helvetica-Bold");
  doc.text(programmeName, 0, 130, { align: "center", width: pageW - 120 });

  // "This certifies that"
  doc.fontSize(13).fillColor("#64748b").font("Helvetica");
  doc.text("This certifies that", 0, 185, { align: "center" });

  // Recipient name
  doc.fontSize(22).fillColor("#f59e0b").font("Helvetica-Bold");
  doc.text(driverName, 0, 210, { align: "center" });

  // Completion text
  doc.fontSize(13).fillColor("#64748b").font("Helvetica");
  doc.text("has successfully completed all requirements", 0, 245, { align: "center" });

  // Divider line
  doc.moveTo(120, 290).lineTo(pageW - 120, 290).lineWidth(1).strokeColor("#e2e8f0").stroke();

  // Certificate number (left)
  doc.fontSize(9).fillColor("#64748b").font("Helvetica");
  doc.text("CERTIFICATE NUMBER", 120, 305);
  doc.fontSize(12).fillColor("#334155").font("Courier-Bold");
  doc.text(cert.certificate_number, 120, 320);

  // Issue date (right)
  doc.fontSize(9).fillColor("#64748b").font("Helvetica");
  doc.text("ISSUED", pageW - 250, 305);
  doc.fontSize(12).fillColor("#334155").font("Helvetica-Bold");
  doc.text(issuedDate, pageW - 250, 320);

  // Verification note
  doc.fontSize(9).fillColor("#94a3b8").font("Helvetica-Oblique");
  doc.text(
    `Verify at ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://betterdriver.co.za"}/verify/${cert.certificate_number}`,
    0,
    pageH - 70,
    { align: "center" }
  );

  doc.end();

  const pdfBuffer = await pdfPromise;
  const safeName = driverName.replace(/\s+/g, "_");

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BetterDriver_Certificate_${safeName}.pdf"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
