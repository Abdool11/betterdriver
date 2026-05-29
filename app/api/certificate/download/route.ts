/**
 * GET /api/certificate/download?id=<certification_id>
 * =====================================================
 * Generates and streams a PDF certificate for the authenticated driver.
 *
 * The PDF is generated on the fly by:
 *   1. Loading the active certificate background image from Supabase Storage
 *      (or falling back to /public/templates/certificate-bg.png if no custom
 *      template has been uploaded via the admin panel).
 *   2. Embedding the driver name, programme name, issue date, and certificate
 *      number as text overlays using pdf-lib.
 *   3. Returning the PDF as a binary response with appropriate headers.
 *
 * AUTH: Requires a valid driver session cookie (same as all portal routes).
 *
 * QUERY PARAMS:
 *   id  — UUID of the row in the `certifications` table.
 *         If omitted, the most recent active certification for the driver is used.
 *
 * ADMIN TEMPLATE UPLOAD:
 *   The active template URL is stored in the `settings` table:
 *     SELECT value FROM settings WHERE key = 'certificate_template_url'
 *   If no row exists, the bundled /public/templates/certificate-bg.png is used.
 *   Admins can upload a new template via the GFA Admin panel
 *   (/admin/certificate-template), which calls POST /api/admin/certificate-template.
 *
 * TEXT OVERLAY POSITIONS (pixels at 150 dpi on 1754×1240 canvas):
 *   Driver name   : centred, y ≈ 480
 *   Programme name: centred, y ≈ 640
 *   Date of issue : x = 156, y = 835
 *   Certificate No: x = 1030, y = 835
 *
 * These positions are stored in the `settings` table as JSON so the admin can
 * adjust them without a code deployment:
 *   SELECT value FROM settings WHERE key = 'certificate_text_positions'
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFileSync } from "fs";
import path from "path";
import { getSession } from "@/lib/auth";

// ── Supabase client (service role for storage access) ─────────────────────────
const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dummy",
  );

// ── Default text positions (pixels on 1754×1240 canvas) ───────────────────────
interface TextPositions {
  nameY: number;
  programmeY: number;
  dateX: number;
  dateY: number;
  certNumX: number;
  certNumY: number;
}

const DEFAULT_POSITIONS: TextPositions = {
  nameY: 480,
  programmeY: 640,
  dateX: 156,
  dateY: 835,
  certNumX: 1030,
  certNumY: 835,
};

// ── PDF dimensions (A4 landscape in points: 842 × 595) ────────────────────────
const PDF_W = 842;
const PDF_H = 595;
const IMG_W = 1754;
const IMG_H = 1240;

function pxToPt(px: number, dimension: "w" | "h"): number {
  return dimension === "w" ? (px / IMG_W) * PDF_W : (px / IMG_H) * PDF_H;
}

export async function GET(req: NextRequest) {
  // ── 1. Authenticate driver ────────────────────────────────────────────────
  const session = await getSession();
  if (!session?.driverId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { searchParams } = new URL(req.url);
  const certId = searchParams.get("id");

  // ── 2. Fetch certification record ─────────────────────────────────────────
  let query = supabase
    .from("certifications")
    .select("id, certificate_number, programme, issued_at, status")
    .eq("driver_id", session.driverId)
    .eq("status", "active");

  if (certId) {
    query = query.eq("id", certId);
  } else {
    query = query.order("issued_at", { ascending: false }).limit(1);
  }

  const { data: certs, error: certErr } = await query;
  if (certErr || !certs?.length) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
  const cert = certs[0];

  // ── 3. Fetch driver name ──────────────────────────────────────────────────
  const { data: driver, error: driverErr } = await supabase
    .from("drivers")
    .select("first_name, last_name")
    .eq("id", session.driverId)
    .single();
  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  const driverName = `${driver.first_name} ${driver.last_name}`.toUpperCase();

  // ── 4. Fetch active template URL from settings ────────────────────────────
  let templateImageBytes: Uint8Array;
  const { data: templateSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "certificate_template_url")
    .single();

  if (templateSetting?.value) {
    // Download from Supabase Storage
    const res = await fetch(templateSetting.value as string);
    if (!res.ok) throw new Error("Failed to fetch template from storage");
    const buf = await res.arrayBuffer();
    templateImageBytes = new Uint8Array(buf);
  } else {
    // Fall back to bundled template
    const templatePath = path.join(process.cwd(), "public", "templates", "certificate-bg.png");
    templateImageBytes = readFileSync(templatePath);
  }

  // ── 5. Fetch text positions from settings (optional override) ─────────────
  let positions: TextPositions = DEFAULT_POSITIONS;
  const { data: posSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "certificate_text_positions")
    .single();
  if (posSetting?.value) {
    try {
      positions = { ...DEFAULT_POSITIONS, ...(JSON.parse(posSetting.value as string) as Partial<TextPositions>) };
    } catch {
      // Use defaults if JSON is malformed
    }
  }

  // ── 6. Build PDF ──────────────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PDF_W, PDF_H]);

  // Embed background image
  const bgImage = await pdfDoc.embedPng(templateImageBytes);
  page.drawImage(bgImage, { x: 0, y: 0, width: PDF_W, height: PDF_H });

  // Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ── Driver name (large, centred, gold) ────────────────────────────────────
  const nameFontSize = 38;
  const nameWidth = boldFont.widthOfTextAtSize(driverName, nameFontSize);
  const nameX = (PDF_W - nameWidth) / 2;
  const nameY = PDF_H - pxToPt(positions.nameY, "h") - nameFontSize;
  page.drawText(driverName, {
    x: nameX,
    y: nameY,
    size: nameFontSize,
    font: boldFont,
    color: rgb(0.961, 0.620, 0.043), // #F59E0B gold
  });

  // ── Programme name (medium, centred, green) ───────────────────────────────
  const programmeName = cert.programme ?? "Professional Truck Driver Programme";
  const progFontSize = 24;
  const progWidth = regularFont.widthOfTextAtSize(programmeName, progFontSize);
  const progX = (PDF_W - progWidth) / 2;
  const progY = PDF_H - pxToPt(positions.programmeY, "h") - progFontSize;
  page.drawText(programmeName, {
    x: progX,
    y: progY,
    size: progFontSize,
    font: regularFont,
    color: rgb(0.133, 0.773, 0.369), // #22C55E green
  });

  // ── Date of issue ─────────────────────────────────────────────────────────
  const issueDate = new Date(cert.issued_at).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const dateX = pxToPt(positions.dateX, "w");
  const dateY = PDF_H - pxToPt(positions.dateY, "h") - 14;
  page.drawText(issueDate, {
    x: dateX,
    y: dateY,
    size: 14,
    font: regularFont,
    color: rgb(0.98, 0.98, 0.98),
  });

  // ── Certificate number ────────────────────────────────────────────────────
  const certNumX = pxToPt(positions.certNumX, "w");
  const certNumY = dateY;
  page.drawText(cert.certificate_number ?? cert.id.slice(0, 8).toUpperCase(), {
    x: certNumX,
    y: certNumY,
    size: 14,
    font: regularFont,
    color: rgb(0.98, 0.98, 0.98),
  });

  // ── Serialise ─────────────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save();

  const filename = `BetterDriver-Certificate-${driverName.replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
