import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  moodleProcessQuizAttempt,
  moodleSubmitQuizAttempt,
  moodleGetAttemptReview,
  moodleGetQuizAttempts,
  moodleGetQuizForModule,
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

  let body: {
    attemptId?: number;
    answers?: Record<string, string | number>;
    sequenceChecks?: Record<string, number>;
    cmid?: string;
    hasEssayQuestions?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { attemptId, answers, cmid, sequenceChecks } = body;
  if (!attemptId || typeof attemptId !== "number" || !answers || typeof answers !== "object") {
    return NextResponse.json(
      { error: "attemptId and answers are required" },
      { status: 400 }
    );
  }
  const moduleCmid = typeof cmid === "string" ? cmid : String(attemptId);

  // Normalize sequenceChecks to numeric keys
  const seqMap: Record<number, number> = {};
  if (sequenceChecks && typeof sequenceChecks === "object") {
    for (const [k, v] of Object.entries(sequenceChecks)) {
      seqMap[parseInt(k, 10)] = v;
    }
  }

  // Fetch driver
  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, moodle_user_id")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  // Count existing attempts for this quiz so we can auto-pass on the 4th try.
  // moodleGetQuizAttempts returns every attempt (finished + the in-progress one
  // currently being submitted), so the 4th submission is attempt #4.
  const quiz = await moodleGetQuizForModule(parseInt(moduleCmid, 10));
  const quizId = quiz?.id;
  let attemptCount = 0;
  if (quizId) {
    const existingAttempts = await moodleGetQuizAttempts(quizId, driver.moodle_user_id);
    attemptCount = existingAttempts.length;
  }
  const autoPass = attemptCount >= 4;

  // Save answers
  try {
    await moodleProcessQuizAttempt(attemptId, answers, seqMap);
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
  const moodleGrade = review?.grade ?? finishedAttempt.sumgrades ?? 0;

  // Determine the pass threshold. Prefer the quiz's configured gradepass from
  // Moodle; otherwise fall back to 80% of the quiz grade (the documented pass
  // mark: all 4 MCQs correct).
  const quiz = await moodleGetQuizForModule(parseInt(moduleCmid, 10));
  const quizGrade = quiz?.grade ?? 0;
  const gradePass = quiz?.gradepass && quiz.gradepass > 0
    ? quiz.gradepass
    : quizGrade * 0.8;

  // ── Grade from the attempt review (authoritative) ───────────────────────────
  // Moodle's top-level sumgrades is unreliable when an ungraded essay/reflection
  // question is present (it can come back as 0/null), which previously made a
  // perfectly-correct MCQ attempt score 0. Instead we inspect each question's
  // own mark/state and treat free-text questions as auto-pass.
  const FREE_TEXT = ["essay", "shortanswer", "numerical"];
  const reviewQuestions = review?.questions ?? [];
  const gradedQuestions = reviewQuestions.filter(
    (q) => q.type && !FREE_TEXT.includes(q.type.toLowerCase())
  );
  const freeTextQuestions = reviewQuestions.filter(
    (q) => q.type && FREE_TEXT.includes(q.type.toLowerCase())
  );

  const isCorrect = (q: { mark: number | null; maxmark: number | null; state: string }) => {
    if (q.mark != null && q.maxmark != null && q.maxmark > 0) {
      return q.mark >= q.maxmark - 1e-6;
    }
    const s = (q.state || "").toLowerCase();
    return s.includes("right") || s === "correct" || s === "gradedright";
  };

  let passed: boolean;
  let displayGrade: number;
  let displayMax: number;

  if (gradedQuestions.length > 0) {
    // Only trust the per-question marks if the review actually exposed usable
    // mark/state data; otherwise fall back to Moodle's overall grade.
    const usable = gradedQuestions.some(
      (q) => q.mark != null || q.maxmark != null || (q.state && q.state.length > 0)
    );
    if (usable) {
      const correctCount = gradedQuestions.filter(isCorrect).length;
      passed = correctCount === gradedQuestions.length;
      const marksSum = gradedQuestions.reduce((acc, q) => acc + (q.mark ?? 0), 0);
      const maxSum = gradedQuestions.reduce((acc, q) => acc + (q.maxmark ?? 0), 0);
      displayGrade = maxSum > 0 ? marksSum : moodleGrade;
      displayMax = maxSum > 0 ? maxSum : quizGrade;
    } else {
      passed = moodleGrade >= gradePass;
      displayGrade = moodleGrade;
      displayMax = quizGrade;
    }
  } else {
    // No auto-graded questions (e.g. essay-only quiz) → free text passes.
    passed = freeTextQuestions.length > 0 ? true : moodleGrade >= gradePass;
    displayGrade = moodleGrade;
    displayMax = quizGrade;
  }

  const hasEssay = body.hasEssayQuestions === true || freeTextQuestions.length > 0;

  console.log("[QUIZ_SUBMIT] grading", {
    gradedQuestions: gradedQuestions.length,
    freeTextQuestions: freeTextQuestions.length,
    passed,
    displayGrade,
    displayMax,
    moodleGrade,
  });

  if (passed) {
    // Mark module complete in BD — trigger via progress API
    try {
      await fetch(`${req.nextUrl.origin}/api/portal/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ moduleId: moduleCmid, completed: true }),
      });
    } catch (err) {
      console.error("[QUIZ_SUBMIT] Failed to mark progress:", err);
    }
  }

  return NextResponse.json({
    success: true,
    passed,
    grade: displayGrade,
    maxGrade: displayMax,
    gradePass: Math.round(gradePass * 100) / 100,
    hasEssay,
    state: finishedAttempt.state,
  });
}
