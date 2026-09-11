import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

type CpdModule = {
  id?: string;
  title?: string;
  due_date?: string;
} | null;

type CpdParticipationRow = {
  id: string;
  completed_at?: string | null;
  cpd_modules: CpdModule;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * GET /api/portal/cpd/progress
 * Returns CPD statistics and records for the authenticated driver only.
 * The client must never provide a driver ID; session.driverId is the sole scope.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await supabaseAdmin
    .from("driver_cpd_participation")
    .select(
      `id, completed_at,
       cpd_modules(id, title, due_date)`
    )
    .eq("driver_id", session.driverId);

  if (error) {
    console.error("[CPD_PROGRESS] Fetch error:", error.message);
    return NextResponse.json({ error: "Could not load CPD records" }, { status: 500 });
  }

  const now = new Date();
  const fourteenDays = new Date();
  fourteenDays.setDate(now.getDate() + 14);

  let completed = 0;
  let overdue = 0;
  let upcoming = 0;

  const records = ((rows ?? []) as CpdParticipationRow[])
    .map((row) => {
      const module = row.cpd_modules;
      const dueDate = module?.due_date ? new Date(module.due_date) : null;
      const validDueDate = dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null;
      let status: "completed" | "overdue" | "urgent" | "upcoming" = "upcoming";

      if (row.completed_at) {
        completed += 1;
        status = "completed";
      } else if (validDueDate && validDueDate < now) {
        overdue += 1;
        status = "overdue";
      } else if (validDueDate && validDueDate <= fourteenDays) {
        upcoming += 1;
        status = "urgent";
      }

      return {
        id: row.id,
        title: module?.title || "CPD activity",
        status,
        dueDate: module?.due_date || null,
        dueDateLabel: formatDate(module?.due_date),
        completedAt: row.completed_at || null,
        completedAtLabel: formatDate(row.completed_at),
      };
    })
    .sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
    });

  return NextResponse.json({
    totalAssigned: records.length,
    completed,
    overdue,
    upcoming,
    records,
  });
}
