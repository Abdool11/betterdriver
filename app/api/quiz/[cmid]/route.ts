import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  moodleGetQuizForModule,
  moodleStartQuizAttempt,
  moodleGetAttemptData,
} from "@/lib/moodle";

export const dynamic = "force-dynamic";

/**
 * GET /api/quiz/{cmid}
 * Returns quiz questions for the current user, starting a fresh attempt if needed.
 * If the user already has a finished passing attempt, returns review data.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cmid: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cmid: cmidStr } = await params;
  const cmid = parseInt(cmidStr, 10);
  if (isNaN(cmid)) {
    return NextResponse.json({ error: "Invalid course module ID" }, { status: 400 });
  }

  // Fetch driver
  const { data: driver, error: driverErr } = await supabaseAdmin
    .from("drivers")
    .select("id, moodle_user_id")
    .eq("id", session.driverId)
    .single();

  if (driverErr || !driver || !driver.moodle_user_id) {
    console.error(`[QUIZ_API] Driver not linked. driverId=${session.driverId}`, driverErr);
    return NextResponse.json({ error: "Driver not linked to Moodle" }, { status: 404 });
  }

  // Get quiz metadata. Prefer direct quizId from the page (mod.instance) since
  // moodleGetQuizForModule's lookup across all courses is fragile.
  const quizIdParam = req.nextUrl.searchParams.get("quizId");
  let quizId = quizIdParam ? parseInt(quizIdParam, 10) : 0;

  let quiz = null;
  if (quizId) {
    console.log(`[QUIZ_API] Using direct quizId=${quizId} for cmid=${cmid}`);
  } else {
    quiz = await moodleGetQuizForModule(cmid);
    if (!quiz) {
      console.error(`[QUIZ_API] Quiz not found for cmid=${cmid}`);
      return NextResponse.json({ error: "Quiz not found for this module" }, { status: 404 });
    }
    quizId = quiz.id;
    console.log(`[QUIZ_API] Found quiz id=${quiz.id} name="${quiz.name}" for cmid=${cmid}`);
  }

  const retry = req.nextUrl.searchParams.get("retry") === "1";

  // Attempts are owned by the Moodle service user (the token's identity), and
  // this token's service lacks mod_quiz_get_user_attempts, so attempts cannot
  // be listed. Critically, every mod_quiz_start_attempt(forcenew) DELETES the
  // previous in-progress attempt for the service user — so re-fetching this
  // endpoint used to orphan the attempt the quiz UI was about to submit,
  // producing HTTP 500 from process_attempt. We pin the live attempt id in an
  // httpOnly cookie and reuse it while it is still in progress.
  const cookieName = `bd_quiz_att_${cmid}`;
  const pinned = Number.parseInt(req.cookies.get(cookieName)?.value ?? "", 10);

  let attemptData = null;
  if (!retry && Number.isInteger(pinned)) {
    const existing = await moodleGetAttemptData(pinned, 0);
    if (existing?.attempt?.state === "inprogress") {
      attemptData = existing;
    }
  }

  if (!attemptData) {
    const attempt = await moodleStartQuizAttempt(quizId);
    if (!attempt) {
      return NextResponse.json({ error: "Unable to start quiz attempt" }, { status: 500 });
    }
    attemptData = await moodleGetAttemptData(attempt.id, 0);
  }

  if (!attemptData) {
    return NextResponse.json({ error: "Unable to load quiz questions" }, { status: 500 });
  }

  const res = NextResponse.json({
    quiz: { id: quizId, name: quiz?.name ?? "Quiz", intro: quiz?.intro, grade: quiz?.grade ?? 0 },
    finished: false,
    attempt: attemptData.attempt,
    questions: attemptData.questions.map((q) => ({
      slot: q.slot,
      type: q.type,
      html: q.html,
      sequencecheck: q.sequencecheck,
      options: q.options,
    })),
  });
  res.cookies.set(cookieName, String(attemptData.attempt.id), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
