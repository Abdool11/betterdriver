import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/portal/cv — generate a basic CV PDF (HTML-to-text for now, PDF library optional)
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: driver } = await supabaseAdmin
    .from("drivers")
    .select(`
      id, first_name, last_name, email, mobile,
      id_number, licence_number, licence_class, licence_expiry, prpd_number,
      years_experience, vehicle_types
    `)
    .eq("id", session.driverId)
    .single();

  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  // Fetch certifications
  const { data: certs } = await supabaseAdmin
    .from("enrolments")
    .select("id, status, enrolled_at, courses(name)")
    .eq("driver_id", session.driverId)
    .eq("status", "certified");

  // Fetch CPD records
  const { data: cpd } = await supabaseAdmin
    .from("cpd_records")
    .select("id, module_title, completed_at")
    .eq("driver_id", session.driverId)
    .order("completed_at", { ascending: false });

  // Generate HTML CV (browser can print-to-PDF)
  const certRows = (certs ?? [])
    .map((c: Record<string, unknown>) => {
      const course = c.courses as unknown as Record<string, string> | null;
      return `<tr>
        <td>${course?.name ?? "Programme"}</td>
        <td>Certified</td>
        <td>${c.enrolled_at ? new Date(String(c.enrolled_at ?? "")).toLocaleDateString("en-ZA") : "—"}</td>
      </tr>`;
    })
    .join("");

  const cpdRows = (cpd ?? [])
    .map(
      (r: Record<string, unknown>) => `<tr>
        <td>${r.module_title}</td>
        <td>${r.completed_at ? new Date(String(r.completed_at ?? "")).toLocaleDateString("en-ZA") : "—"}</td>
      </tr>`
    )
    .join("");

  const vehicleList = Array.isArray(driver.vehicle_types)
    ? (driver.vehicle_types as string[]).join(", ")
    : "—";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BetterDriver CV — ${driver.first_name} ${driver.last_name}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 2rem; font-size: 13px; }
  .header { background: #0a1628; color: white; padding: 1.5rem 2rem; border-radius: 8px; margin-bottom: 1.5rem; }
  .header h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
  .header p { margin: 0; color: #94a3b8; font-size: 0.875rem; }
  .badge { display: inline-block; background: #2ecc71; color: #0a1628; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-top: 0.5rem; }
  .section { margin-bottom: 1.5rem; }
  .section h2 { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.375rem; margin-bottom: 0.75rem; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 0.4rem 0.5rem; vertical-align: top; }
  td:first-child { color: #64748b; width: 40%; }
  td:last-child { font-weight: 500; }
  .cert-table td { border-bottom: 1px solid #f1f5f9; }
  .cert-table th { text-align: left; font-size: 0.75rem; color: #64748b; padding: 0.4rem 0.5rem; border-bottom: 2px solid #e2e8f0; }
  .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.75rem; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <h1>${driver.first_name} ${driver.last_name}</h1>
  <p>Professional Driver · BetterDriver Certified</p>
  <span class="badge">Verified Profile</span>
</div>

<div class="section">
  <h2>Personal Information</h2>
  <table>
    <tr><td>ID Number</td><td>${driver.id_number ?? "—"}</td></tr>
    <tr><td>Email</td><td>${driver.email ?? "—"}</td></tr>
    <tr><td>Mobile</td><td>${driver.mobile ?? "—"}</td></tr>
  </table>
</div>

<div class="section">
  <h2>Driving Licence</h2>
  <table>
    <tr><td>Licence Number</td><td>${driver.licence_number ?? "—"}</td></tr>
    <tr><td>Licence Class</td><td>${driver.licence_class ?? "—"}</td></tr>
    <tr><td>Expiry Date</td><td>${driver.licence_expiry ? new Date(driver.licence_expiry).toLocaleDateString("en-ZA") : "—"}</td></tr>
    ${driver.prpd_number ? `<tr><td>PrDP Number</td><td>${driver.prpd_number}</td></tr>` : ""}
  </table>
</div>

<div class="section">
  <h2>Experience</h2>
  <table>
    <tr><td>Years Driving</td><td>${driver.years_experience ?? "—"}</td></tr>
    <tr><td>Vehicle Types</td><td>${vehicleList}</td></tr>
  </table>
</div>

${certRows ? `
<div class="section">
  <h2>Certifications</h2>
  <table class="cert-table">
    <thead><tr><th>Programme</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>${certRows}</tbody>
  </table>
</div>` : ""}

${cpdRows ? `
<div class="section">
  <h2>CPD Record</h2>
  <table class="cert-table">
    <thead><tr><th>Module</th><th>Completed</th></tr></thead>
    <tbody>${cpdRows}</tbody>
  </table>
</div>` : ""}

<div class="footer">
  Generated by BetterDriver · betterdriver.co.za · Certifications verifiable at betterdriver.co.za/registry
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="BetterDriver_CV_${driver.first_name}_${driver.last_name}.html"`,
    },
  });
}
