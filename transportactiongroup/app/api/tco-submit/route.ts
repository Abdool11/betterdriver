import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Lazy initialisation — client is created inside the handler, not at module load time.
// This prevents the "supabaseUrl is required" error during Next.js build-time page data collection.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      user_name,
      user_email,
      company,
      country,
      currency_code,
      truck_type,
      use_case,
      notes,
      inputs_json,
      diesel_tco,
      electric_tco,
      total_saving,
      break_even_year,
      export_type,
    } = body;

    // Basic validation
    if (!user_name || !user_email || !company) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase.from("tco_submissions").insert({
      user_name,
      user_email,
      company,
      country: country ?? null,
      currency: currency_code ?? "ZAR",
      diesel_tco: diesel_tco ?? null,
      electric_tco: electric_tco ?? null,
      fleet_saving: total_saving ?? null,
      payback_years: break_even_year ?? null,
      export_format: export_type ?? null,
    });

    if (error) {
      console.error("TCO submit error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("TCO submit exception:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
