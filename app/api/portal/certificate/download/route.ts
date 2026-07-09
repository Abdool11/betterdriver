import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { moodleGetProgress, moodleGetCourseModules, normalizeProgrammeSlug } from "@/lib/moodle";
import { ensureCertificate } from "@/lib/certificate";
import PDFDocument from "pdfkit";

/**
 * Upload a generated PDF to Supabase Storage and update the certifications row.
 * Returns the public URL on success, or null on failure.
 */
async function uploadCertificatePdf(
  certificateNumber: string,
  pdfBuffer: Buffer
): Promise<string | null> {
  const fileName = `${certificateNumber}.pdf`;
  const filePath = `public/${fileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("certificates")
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("[DOWNLOAD] Failed to upload PDF to storage:", uploadError.message);
    return null;
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("certificates")
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabaseAdmin
    .from("certifications")
    .update({ pdf_url: publicUrl })
    .eq("certificate_number", certificateNumber);

  if (updateError) {
    console.error("[DOWNLOAD] Failed to update pdf_url:", updateError.message);
  }

  return publicUrl;
}

/**
 * GET /api/portal/certificate/download
 * Returns the driver's certificate as a downloadable PDF.
 * If pdf_url exists in the DB, redirects to it.
 * Otherwise generates a branded PDF certificate on the fly, uploads it to
 * Supabase Storage, and redirects to the stored PDF on the next request.
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

  const GOLD = "#C9A227";
  const LINE = "#D9C9A0";
  const NAVY = "#0F1E3D";
  const NAVY_SOFT = "#33415C";
  const GREY = "#6B7280";

  const spaced = (s: string) => s.toUpperCase().split("").join(" ");

  const drawSeal = (cx: number, cy: number, r: number) => {
    doc.circle(cx, cy, r).fillColor(GOLD).fill();
    doc.circle(cx, cy, r - 4).fillColor(NAVY).fill();
    doc.circle(cx, cy, r - 11).fillColor(GOLD).fill();
    doc.circle(cx, cy, r - 14).fillColor("#FFFFFF").fill();
    doc
      .font("Helvetica-Bold")
      .fontSize(r * 0.5)
      .fillColor(NAVY)
      .text("BD", cx - r, cy - r * 0.3, { width: r * 2, align: "center" });
  };

  const drawDiamond = (x: number, y: number, s: number, color: string) => {
    doc.save();
    doc.translate(x, y).rotate(45);
    doc.rect(-s / 2, -s / 2, s, s).fillColor(color).fill();
    doc.restore();
  };

  // Subtle cream gradient background
  const grad = doc.linearGradient(0, 0, 0, pageH);
  grad.stop(0, "#FFFFFF");
  grad.stop(1, "#FBF6EA");
  doc.rect(0, 0, pageW, pageH).fill(grad);

  // Faint rotated watermark
  doc.save();
  doc.rotate(-28, { origin: [pageW / 2, pageH / 2] });
  doc
    .font("Helvetica-Bold")
    .fontSize(120)
    .fillColor("#F1E9D2")
    .text("BetterDriver", 0, pageH / 2 - 60, { align: "center", width: pageW });
  doc.restore();

  // Double decorative frame
  doc.roundedRect(22, 22, pageW - 44, pageH - 44, 16).lineWidth(3).strokeColor(GOLD).stroke();
  doc.roundedRect(32, 32, pageW - 64, pageH - 64, 10).lineWidth(1).strokeColor(LINE).stroke();

  // Corner diamonds
  const m = 40;
  drawDiamond(m, m, 9, GOLD);
  drawDiamond(pageW - m, m, 9, GOLD);
  drawDiamond(m, pageH - m, 9, GOLD);
  drawDiamond(pageW - m, pageH - m, 9, GOLD);

  // Top emblem + brand
  drawSeal(pageW / 2, 96, 30);
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(NAVY)
    .text("BetterDriver", 0, 138, { align: "center", width: pageW });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(GREY)
    .text(spaced("Certificate of Completion"), 0, 172, { align: "center", width: pageW });
  doc
    .moveTo(pageW / 2 - 60, 192)
    .lineTo(pageW / 2 + 60, 192)
    .lineWidth(1.5)
    .strokeColor(GOLD)
    .stroke();

  // Programme title
  doc
    .font("Times-Bold")
    .fontSize(30)
    .fillColor(NAVY)
    .text(programmeName, 80, 215, { align: "center", width: pageW - 160 });

  // Recipient
  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor(GREY)
    .text("This certificate is proudly presented to", 0, 280, { align: "center", width: pageW });
  doc
    .font("Times-Bold")
    .fontSize(36)
    .fillColor(GOLD)
    .text(driverName, 80, 302, { align: "center", width: pageW - 160 });
  const nameW = Math.min(pageW - 200, 460);
  doc
    .moveTo(pageW / 2 - nameW / 2, 352)
    .lineTo(pageW / 2 + nameW / 2, 352)
    .lineWidth(1)
    .strokeColor(LINE)
    .stroke();
  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor(GREY)
    .text("who has successfully completed all course requirements.", 0, 366, {
      align: "center",
      width: pageW,
    });

  // Footer: three columns
  const footerY = 430;
  const colW = (pageW - 220) / 3;
  const x1 = 90;
  const x2 = x1 + colW + 20;
  const x3 = x2 + colW + 20;

  // Certificate number (left)
  doc.font("Helvetica").fontSize(8.5).fillColor(GREY).text(spaced("Certificate Number"), x1, footerY);
  doc.font("Courier-Bold").fontSize(13).fillColor(NAVY_SOFT).text(cert.certificate_number, x1, footerY + 16);

  // Signature (center)
  doc.font("Helvetica-Oblique").fontSize(15).fillColor(NAVY).text("A Kamdar", x2, footerY + 6);
  doc
    .moveTo(x2, footerY + 34)
    .lineTo(x2 + 200, footerY + 34)
    .lineWidth(1)
    .strokeColor("#B9B9B9")
    .stroke();
  doc.font("Helvetica").fontSize(8.5).fillColor(GREY).text(spaced("Authorised Signature"), x2, footerY + 40);

  // Date issued (right)
  doc.font("Helvetica").fontSize(8.5).fillColor(GREY).text(spaced("Date Issued"), x3, footerY);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY_SOFT).text(issuedDate, x3, footerY + 16);

  // Gold seal stamp (bottom-right)
  drawSeal(pageW - 110, footerY + 28, 40);

  // Verification line
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#9AA3B2")
    .text(
      `Verify authenticity at ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://betterdriver.co.za"}/verify/${cert.certificate_number}`,
      0,
      pageH - 46,
      { align: "center", width: pageW }
    );

  doc.end();

  const pdfBuffer = await pdfPromise;

  // Persist the generated PDF so future requests can be served from Storage
  if (cert.certificate_number) {
    const publicUrl = await uploadCertificatePdf(cert.certificate_number, pdfBuffer);
    if (publicUrl) {
      return NextResponse.redirect(publicUrl);
    }
  }

  const safeName = driverName.replace(/\s+/g, "_");

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BetterDriver_Certificate_${safeName}.pdf"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
