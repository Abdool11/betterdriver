import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/portal/bulletins/:id — fetch a single bulletin
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: driver } = await supabaseAdmin
    .from("drivers")
    .select("company_id")
    .eq("id", session.driverId)
    .single();

  const { data: bulletin, error } = await supabaseAdmin
    .from("bulletins")
    .select("id, title, content, urgency, status, created_at, company_id")
    .eq("id", id)
    .single();

  if (error || !bulletin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ensure driver can only see bulletins from their own company
  if (bulletin.company_id !== driver?.company_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ bulletin });
}
