import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/portal/bulletins/unread-count
// Returns the number of active (disseminated) bulletins for the driver's company.
// TODO: add per-driver read tracking to return true "unread" count.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ count: 0 });
  }

  const { data: driver } = await supabaseAdmin
    .from("drivers")
    .select("company_id")
    .eq("id", session.driverId)
    .single();

  const companyId = driver?.company_id;
  if (!companyId) {
    return NextResponse.json({ count: 0 });
  }

  const { count, error } = await supabaseAdmin
    .from("bulletins")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "disseminated");

  if (error) {
    console.error("[BULLETINS] unread-count error:", error.message);
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
