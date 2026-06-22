import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/portal/bulletins/unread-count
// Returns the number of unread active bulletins for the driver's company.
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

  // Count bulletins where there is NO driver_bulletin_interactions row with read_at set
  const { data: rows, error } = await supabaseAdmin
    .from("bulletins")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "disseminated");

  if (error) {
    console.error("[BULLETINS] unread-count error:", error.message);
    return NextResponse.json({ count: 0 });
  }

  const bulletinIds = (rows ?? []).map((r) => r.id);
  if (bulletinIds.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  const { data: readRows, error: readErr } = await supabaseAdmin
    .from("driver_bulletin_interactions")
    .select("bulletin_id")
    .eq("driver_id", session.driverId)
    .not("read_at", "is", null)
    .in("bulletin_id", bulletinIds);

  if (readErr) {
    console.error("[BULLETINS] unread-count read query error:", readErr.message);
    return NextResponse.json({ count: 0 });
  }

  const readSet = new Set((readRows ?? []).map((r) => r.bulletin_id));
  const unreadCount = bulletinIds.filter((id) => !readSet.has(id)).length;

  return NextResponse.json({ count: unreadCount });
}
