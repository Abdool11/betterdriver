import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/portal/certificate/download
 * Returns the driver's certificate PDF.
 * If pdf_url exists, redirects to it.
 * Otherwise generates a branded HTML certificate the browser can print-to-PDF.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: cert } = await supabaseAdmin
    .from("certifications")
    .select("certificate_number, pdf_url, issued_at, programme, driver_id")
    .eq("driver_id", session.driverId)
    .eq("status", "active")
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Certificate — ${driverName}</title>
<style>
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    background: #0a1628;
    color: #1a1a2e;
    margin: 0;
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    box-sizing: border-box;
  }
  .certificate {
    background: #fff;
    border: 8px solid #f59e0b;
    padding: 3rem 2.5rem;
    max-width: 800px;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }
  .logo {
    font-family: Arial, sans-serif;
    font-weight: 800;
    font-size: 1.25rem;
    color: #f59e0b;
    letter-spacing: 0.05em;
    margin-bottom: 1.5rem;
  }
  .label {
    font-family: Arial, sans-serif;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 1rem;
    color: #0a1628;
  }
  .recipient {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f59e0b;
    margin: 1rem 0;
  }
  .programme {
    font-size: 1.125rem;
    font-weight: 600;
    color: #334155;
    margin: 1rem 0 2rem;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
    font-family: Arial, sans-serif;
    font-size: 0.875rem;
    color: #64748b;
  }
  .meta div { text-align: left; }
  .meta .num { font-family: monospace; color: #334155; }
  .print-btn {
    display: inline-block;
    margin-top: 1.5rem;
    padding: 0.625rem 1.5rem;
    background: #0a1628;
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    font-family: Arial, sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
  }
  .print-btn:hover { background: #1a3050; }
  @media print {
    .print-btn { display: none; }
    body { padding: 0; background: #fff; }
    .certificate { box-shadow: none; border-width: 4px; }
  }
</style>
</head>
<body>
<div class="certificate">
  <div class="logo">BetterDriver</div>
  <div class="label">Certificate of Completion</div>
  <h1>${programmeName}</h1>
  <p style="font-size:0.9375rem;color:#64748b;margin:0;">This certifies that</p>
  <div class="recipient">${driverName}</div>
  <p style="font-size:0.9375rem;color:#64748b;margin:0;">has successfully completed all requirements</p>
  <div class="meta">
    <div>
      <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.25rem;">Certificate number</div>
      <div class="num">${cert.certificate_number}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.25rem;">Issued</div>
      <div class="num">${issuedDate}</div>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">Save as PDF</button>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="BetterDriver_Certificate_${driverName.replace(/\s+/g, "_")}.html"`,
    },
  });
}
