import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/portal/cpd/progress
 * Returns CPD stats for the logged-in driver:
 * - totalAssigned
 * - completed
 * - overdue
 * - upcoming (within 14 days)
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch assigned CPD modules via participation (join to get due_date)
  const { data: rows, error } = await supabaseAdmin
    .from("driver_cpd_participation")
    .select(
      `id, completed_at,
       cpd_modules(id, title, due_date)`
    )
    .eq("driver_id", session.driverId);

  if (error) {
    console.error("[CPD_PROGRESS] Fetch error:", error.message);
    return NextResponse.json(
      { totalAssigned: 0, completed: 0, overdue: 0, upcoming: 0 },
      { status: 200 }
    );
  }

  const now = new Date();
  const fourteenDays = new Date();
  fourteenDays.setDate(now.getDate() + 14);

  let totalAssigned = 0;
  let completed = 0;
  let overdue = 0;
  let upcoming = 0;

  for (const row of rows ?? []) {
    const mod = row.cpd_modules as unknown as { due_date?: string; title?: string } | null;
    const dueDate = mod?.due_date ? new Date(mod.due_date) : null;
    totalAssigned++;

    if (row.completed_at) {
      completed++;
      continue;
    }

    if (dueDate) {
      if (dueDate < now) {
        overdue++;
      } else if (dueDate <= fourteenDays) {
        upcoming++;
      }
    }
  }

  return NextResponse.json({ totalAssigned, completed, overdue, upcoming });
}
