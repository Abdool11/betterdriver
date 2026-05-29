/**
 * GET /api/registry?q=<search>
 * ════════════════════════════════════════════════════════════════════════════
 * PUBLIC endpoint — no authentication required.
 *
 * Returns a paginated list of certified drivers from the `certifications` table,
 * joined to the `drivers` table for name and ID number.
 *
 * QUERY PARAMS:
 *   q     — (optional) search string. Matches against:
 *             • driver first_name + last_name (ILIKE)
 *             • driver id_number (ILIKE)
 *             • certifications.certificate_number (ILIKE)
 *   page  — (optional) 1-based page number. Defaults to 1.
 *   limit — (optional) results per page. Defaults to 20, max 100.
 *
 * RESPONSE:
 *   {
 *     results: RegistryEntry[],
 *     total: number,
 *     page: number,
 *     totalPages: number
 *   }
 *
 * RegistryEntry:
 *   id              — certification UUID
 *   driverName      — "First Last"
 *   idNumber        — driver SA ID number (last 4 digits masked: "***-1234")
 *   certificateNumber — "BD-YYYYMMDD-XXXXXXXX"
 *   programme       — programme name string
 *   issuedAt        — ISO8601 timestamp
 *   status          — "active" | "revoked"
 *   verificationUrl — "https://betterdriver.co.za/verify/<certificateNumber>"
 *
 * SECURITY:
 *   - Driver ID numbers are partially masked in the response (last 4 digits only).
 *   - No personal contact information (email, mobile) is returned.
 *   - Rate limiting is handled at the infrastructure level (Vercel Edge).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    // Use the anon key for public reads — RLS on certifications table must allow
    // SELECT for anon role (status = 'active' only).
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "dummy",
  );

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://betterdriver.co.za";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function maskIdNumber(id: string | null): string {
  if (!id || id.length < 4) return "••••••••••••••";
  return `${"•".repeat(id.length - 4)}${id.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)));
  const offset = (page - 1) * limit;

  const supabase = getSupabase();

  // ── Build query ────────────────────────────────────────────────────────────
  // We join certifications → drivers using a Supabase foreign key relationship.
  // The query returns only active certifications.
  //
  // Supabase PostgREST syntax for filtering across a join:
  //   .or("drivers.first_name.ilike.%q%,drivers.last_name.ilike.%q%,certificate_number.ilike.%q%")
  // However PostgREST does not support cross-table OR filters directly, so we
  // use a Postgres function / view approach via RPC, or fall back to a
  // two-step query. We use two-step here for simplicity and compatibility.

  let driverIds: string[] | null = null;

  if (q) {
    // Step 1: find matching driver IDs by name or ID number
    const { data: matchedDrivers } = await supabase
      .from("drivers")
      .select("id, first_name, last_name, id_number")
      .or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,id_number.ilike.%${q}%`,
      );

    driverIds = matchedDrivers?.map(d => d.id) ?? [];

    // If the query looks like a certificate number, include cert-number matches too
    // (handled below in the certifications query)
  }

  // Step 2: query certifications
  let certQuery = supabase
    .from("certifications")
    .select(
      `
      id,
      certificate_number,
      programme,
      issued_at,
      status,
      driver_id,
      drivers!inner (
        first_name,
        last_name,
        id_number
      )
    `,
      { count: "exact" },
    )
    .eq("status", "active")
    .order("issued_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    if (driverIds && driverIds.length > 0) {
      // Match by driver IDs OR by certificate number
      certQuery = certQuery.or(
        `driver_id.in.(${driverIds.join(",")}),certificate_number.ilike.%${q}%`,
      );
    } else {
      // No matching drivers — only search by certificate number
      certQuery = certQuery.ilike("certificate_number", `%${q}%`);
    }
  }

  const { data: certs, count, error } = await certQuery;

  if (error) {
    console.error("[REGISTRY] Supabase error:", error);
    return NextResponse.json({ error: "Registry lookup failed" }, { status: 500 });
  }

  // ── Shape response ─────────────────────────────────────────────────────────
  const results = (certs ?? []).map(cert => {
    const driver = cert.drivers as unknown as { first_name: string; last_name: string; id_number: string | null } | null;
    const driverName = driver
      ? `${driver.first_name} ${driver.last_name}`
      : "Unknown Driver";
    const idNumber = maskIdNumber(driver?.id_number ?? null);

    return {
      id: cert.id as string,
      driverName,
      idNumber,
      certificateNumber: cert.certificate_number as string,
      programme: cert.programme as string ?? "BetterDriver Programme",
      issuedAt: cert.issued_at as string,
      status: cert.status as string,
      verificationUrl: `${BASE_URL}/verify/${cert.certificate_number}`,
    };
  });

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json(
    { results, total, page, totalPages },
    {
      headers: {
        // Allow public caching for 60 seconds — registry is public data
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
