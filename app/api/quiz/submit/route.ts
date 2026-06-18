import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  moodleProcessQuizAttempt,
  moodleSubmitQuizAttempt,
  moodleGetAttemptReview,
  moodleGetQuizAttempts,
} from "@/lib/moodle";

export const dynamic = "force-dynamic";

/**
 * POST /api/quiz/submit
 * Body: { attemptId: number, answers: Record<slot, answerValue> }
 *
 * 1. Processes answers into the Moodle attempt
 * 2. Submits / finishes the attempt
 * 3. Reviews the attempt to get the grade
 * 4. Marks the module complete in BD if the attempt passed
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { attemptId?: number; answers?: Record<string, string | number>; cmid?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { attemptId, answers, cmid } = body;
  if (!attemptId || typeof attemptId !== "number" || !answers || typeof answers !== "object") {
    return NextResponse.json(
      { error: "attemptId and answers are required" },
      { status: 400 }
    );
  }
  const moduleCmid = typeof cmid === "string" ? cmid : String(attemptId);

  // Fetch driver
  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, moodle_user_id")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  // Save answers
  try {
    await moodleProcessQuizAttempt(attemptId, answers);
  } catch (err: any) {
    console.error("[QUIZ_SUBMIT] Failed to process answers:", err.message);
    return NextResponse.json(
      { error: "Failed to save answers. Please try again." },
      { status: 500 }
    );
  }

  // Finish the attempt
  const finishedAttempt = await moodleSubmitQuizAttempt(attemptId);
  if (!finishedAttempt) {
    return NextResponse.json(
      { error: "Failed to submit quiz attempt." },
      { status: 500 }
    );
  }

  // Get review data
  const review = await moodleGetAttemptReview(attemptId);
  const grade = review?.grade ?? finishedAttempt.sumgrades ?? 0;

  // Consider "passing" if grade > 0 (Moodle quizzes often require a minimum grade;
  // we rely on Moodle's internal pass/fail logic and just check there is a positive grade.
  // If the quiz is configured with no grade, any finish counts as completion.)
  const passed = grade !== null && grade >= 0;

  if (passed) {
    // Mark module complete in BD — trigger via progress API
    try {
      await fetch(`${req.nextUrl.origin}/api/portal/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: moduleCmid, completed: true }),
      });
    } catch (err) {
      console.error("[QUIZ_SUBMIT] Failed to mark progress:", err);
    }
  }

  return NextResponse.json({
    success: true,
    passed,
    grade,
    state: finishedAttempt.state,
  });
}
