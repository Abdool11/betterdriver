import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/portal/bulletins/:id/read
 * Upserts a driver_bulletin_interactions row with read_at = NOW().
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Bulletin ID required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("driver_bulletin_interactions")
    .upsert(
      {
        driver_id: session.driverId,
        bulletin_id: id,
        read_at: new Date().toISOString(),
      },
      { onConflict: "driver_id,bulletin_id" }
    );

  if (error) {
    console.error("[BULLETIN_READ] Upsert failed:", error.message);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
