import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/portal/certificate/download — generate a printable HTML certificate
// The browser will open this as an attachment; the user can print-to-PDF from the browser print dialog.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch driver
  const { data: driver } = await supabaseAdmin
    .from("drivers")
    .select("id, full_name, email")
    .eq("id", session.driverId)
    .single();

  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  // Fetch active certificate
  const { data: cert } = await supabaseAdmin
    .from("certifications")
    .select("id, certificate_number, programme, issued_at, expires_at, course_id")
    .eq("driver_id", session.driverId)
    .eq("status", "active")
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cert) {
    return NextResponse.json({ error: "No certificate available. Complete your course first." }, { status: 404 });
  }

  // Fetch programme name
  let programmeName = "The Professional Truck Driver Programme";
  if (cert.course_id) {
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("name")
      .eq("id", cert.course_id)
      .maybeSingle();
    if (course?.name) programmeName = course.name;
  } else if (cert.programme === "p2") {
    programmeName = "Eco-Driving Mastery";
  }

  const issuedDate = new Date(cert.issued_at).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://betterdriver.co.za";
  const verificationUrl = `${siteUrl}/registry?cert=${cert.certificate_number}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BetterDriver Certificate — ${driver.full_name}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    background: #f0f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
  .certificate {
    width: 297mm;
    height: 210mm;
    background: linear-gradient(135deg, #0a1628 0%, #162d50 100%);
    border: 3px solid #f59e0b;
    border-radius: 12px;
    padding: 3rem;
    position: relative;
    color: #f9fafb;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .border-inner {
    position: absolute;
    top: 12px; left: 12px; right: 12px; bottom: 12px;
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 8px;
    pointer-events: none;
  }
  .logo {
    font-family: 'Arial', sans-serif;
    font-weight: 800;
    font-size: 1.5rem;
    color: #f59e0b;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  .logo-sub {
    font-family: 'Arial', sans-serif;
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 2rem;
  }
  .title {
    font-size: 2rem;
    font-weight: 700;
    color: #f59e0b;
    margin-bottom: 0.5rem;
    letter-spacing: 0.02em;
  }
  .subtitle {
    font-size: 0.875rem;
    color: #94a3b8;
    margin-bottom: 2.5rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .presented-to {
    font-size: 0.875rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }
  .name {
    font-family: 'Georgia', serif;
    font-size: 2.25rem;
    font-weight: 700;
    color: #f9fafb;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid rgba(245, 158, 11, 0.3);
    padding-bottom: 0.5rem;
    min-width: 60%;
  }
  .has-completed {
    font-size: 0.875rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }
  .programme {
    font-family: 'Georgia', serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #f59e0b;
    margin-bottom: 2rem;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    width: 80%;
    margin-top: 2rem;
    align-items: flex-end;
  }
  .cert-number {
    text-align: left;
  }
  .cert-number-label {
    font-family: 'Arial', sans-serif;
    font-size: 0.7rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.25rem;
  }
  .cert-number-value {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: #94a3b8;
  }
  .date-block {
    text-align: right;
  }
  .date-label {
    font-family: 'Arial', sans-serif;
    font-size: 0.7rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.25rem;
  }
  .date-value {
    font-family: 'Arial', sans-serif;
    font-size: 0.875rem;
    color: #94a3b8;
  }
  .verified {
    margin-top: 1rem;
    font-family: 'Arial', sans-serif;
    font-size: 0.7rem;
    color: #10b981;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .print-btn {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: #f59e0b;
    color: #0a1628;
    border: none;
    padding: 0.625rem 1.25rem;
    border-radius: 6px;
    font-family: 'Arial', sans-serif;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    z-index: 100;
  }
  @media print {
    body { background: none; }
    .print-btn { display: none; }
    .certificate { border-radius: 0; }
  }
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  <div class="certificate">
    <div class="border-inner"></div>
    <div class="logo">BetterDriver</div>
    <div class="logo-sub">Driver Development Portal</div>
    <div class="title">Certificate of Completion</div>
    <div class="subtitle">This is to certify that</div>
    <div class="presented-to">Presented to</div>
    <div class="name">${driver.full_name}</div>
    <div class="has-completed">has successfully completed</div>
    <div class="programme">${programmeName}</div>
    <div class="footer">
      <div class="cert-number">
        <div class="cert-number-label">Certificate Number</div>
        <div class="cert-number-value">${cert.certificate_number}</div>
        <div class="verified">&#10003; Verified</div>
      </div>
      <div class="date-block">
        <div class="date-label">Date Issued</div>
        <div class="date-value">${issuedDate}</div>
      </div>
    </div>
  </div>
  <script>
    // Auto-trigger print dialog on load
    window.onload = function() { setTimeout(function() { window.print(); }, 500); };
  </script>
</body>
</html>`;

  const safeName = driver.full_name.replace(/[^a-zA-Z0-9]/g, "_");

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="BetterDriver_Certificate_${safeName}.html"`,
    },
  });
}
