import { NextResponse } from "next/server";
import { getConfigs, supabaseAdmin } from "@/lib/supabase";

// Public endpoint — serves centralised impact stats for TAG, GFA, and BD
// Returns: { workshops, training_seats, certifications, companies, data_source }
export async function GET() {
  try {
    const config = await getConfigs([
      "stat_workshops",
      "stat_workshops_use_live",
      "stat_training_seats",
      "stat_training_seats_use_live",
      "stat_certifications",
      "stat_certifications_use_live",
      "stat_companies",
      "stat_companies_use_live",
    ]);

    // Defaults
    const defaults: Record<string, string> = {
      stat_workshops: "34",
      stat_workshops_use_live: "false",
      stat_training_seats: "252",
      stat_training_seats_use_live: "false",
      stat_certifications: "207",
      stat_certifications_use_live: "false",
      stat_companies: "7",
      stat_companies_use_live: "false",
    };
    const c = { ...defaults, ...config };

    // LIVE_STUB: Asif — replace these queries with the correct table names once DB is live
    let workshops = parseInt(c.stat_workshops) || 34;
    let training_seats = parseInt(c.stat_training_seats) || 252;
    let certifications = parseInt(c.stat_certifications) || 207;
    let companies = parseInt(c.stat_companies) || 7;
    let data_source = "static";

    if (c.stat_workshops_use_live === "true") {
      const { count } = await supabaseAdmin.from("workshops").select("*", { count: "exact", head: true });
      if (count !== null) { workshops = count; data_source = "live"; }
    }
    if (c.stat_training_seats_use_live === "true") {
      const { count } = await supabaseAdmin.from("bookings").select("*", { count: "exact", head: true });
      if (count !== null) { training_seats = count; data_source = "live"; }
    }
    if (c.stat_certifications_use_live === "true") {
      const { count } = await supabaseAdmin.from("certificates").select("*", { count: "exact", head: true });
      if (count !== null) { certifications = count; data_source = "live"; }
    }
    if (c.stat_companies_use_live === "true") {
      const { count } = await supabaseAdmin.from("companies").select("*", { count: "exact", head: true });
      if (count !== null) { companies = count; data_source = "live"; }
    }

    return NextResponse.json(
      { workshops, training_seats, certifications, companies, data_source },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { workshops: 34, training_seats: 252, certifications: 207, companies: 7, data_source: "fallback" },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
