import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/portal/bulletins — list active bulletins for the driver's company
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: driver } = await supabaseAdmin
    .from("drivers")
    .select("company_id")
    .eq("id", session.driverId)
    .single();

  const companyId = driver?.company_id;
  if (!companyId) {
    return NextResponse.json({ bulletins: [] });
  }

  const { data: bulletins, error } = await supabaseAdmin
    .from("bulletins")
    .select(
      `id, title, content, urgency, status, created_at,
       driver_bulletin_interactions(read_at)`
    )
    .eq("company_id", companyId)
    .eq("status", "disseminated")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[BULLETINS] Fetch error:", error.message);
    return NextResponse.json({ bulletins: [] });
  }

  const enriched = (bulletins ?? []).map((b) => {
    const interaction = b.driver_bulletin_interactions as
      | { read_at: string | null }[]
      | null;
    const readAt = interaction?.[0]?.read_at ?? null;
    return {
      id: b.id,
      title: b.title,
      content: b.content,
      urgency: b.urgency,
      status: b.status,
      created_at: b.created_at,
      read: !!readAt,
    };
  });

  return NextResponse.json({ bulletins: enriched });
}
