"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Trophy, RotateCcw, AlertCircle } from "lucide-react";

interface QuizOption {
  id: number;
  text: string;
  fraction: number;
}

interface QuizQuestion {
  slot: number;
  type: string;
  html: string;
  sequencecheck?: number;
  options?: {
    answers?: QuizOption[];
  };
}

interface QuizData {
  quiz: {
    id: number;
    name: string;
    intro?: string;
    grade: number;
  };
  finished: boolean;
  attempt: { id: number; state: string; sumgrades: number | null };
  grade?: number | null;
  questions?: QuizQuestion[];
}

interface Props {
  moduleId: string;
  quizId?: number;
  moduleName: string;
  onComplete?: () => void;
}

export default function QuizPlayer({ moduleId, quizId, moduleName, onComplete }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "ready" | "review" | "error">("loading");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [sequenceChecks, setSequenceChecks] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; grade: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const loadQuiz = useCallback(async (retry = false) => {
    setPhase("loading");
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (retry) params.set("retry", "1");
      if (quizId) params.set("quizId", String(quizId));
      const url = `/api/quiz/${moduleId}${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to load quiz.");
        setPhase("error");
        return;
      }
      setQuiz(data);
      if (data.finished) {
        setResult({
          passed: (data.grade ?? 0) >= 0,
          grade: data.grade ?? 0,
        });
        setPhase("review");
      } else {
        // Cache sequencecheck values from Moodle for each slot
        const seqMap: Record<number, number> = {};
        (data.questions ?? []).forEach((q: any) => {
          if (typeof q.slot === "number" && typeof q.sequencecheck === "number") {
            seqMap[q.slot] = q.sequencecheck;
          }
        });
        setSequenceChecks(seqMap);
        setPhase("ready");
      }
    } catch (err) {
      console.error("[QuizPlayer] Load error:", err);
      setErrorMsg("Network error while loading quiz.");
      setPhase("error");
    }
  }, [moduleId]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  function handleSelect(slot: number, value: string) {
    setAnswers((prev) => ({ ...prev, [slot]: value }));
  }

  async function handleSubmit() {
    if (!quiz || !quiz.questions) return;
    // Essay / free-form questions always pass — don't block submission if empty
    const unanswered = quiz.questions.filter(
      (q) => q.type !== "essay" && !answers[q.slot]
    );
    if (unanswered.length > 0) {
      setErrorMsg(`Please answer all ${unanswered.length} remaining question(s).`);
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const hasEssay = quiz.questions.some((q) => q.type === "essay");

    // Build answers keyed by slot — essay questions get a default if left blank
    const payloadAnswers: Record<string, string | number> = {};
    const payloadSeq: Record<string, number> = {};
    for (const q of quiz.questions) {
      const slot = q.slot;
      const userAnswer = answers[slot];
      if (q.type === "essay") {
        payloadAnswers[slot] = userAnswer?.trim() ? userAnswer : "No response provided.";
      } else if (userAnswer) {
        payloadAnswers[slot] = userAnswer;
      }
      if (sequenceChecks[slot] !== undefined) {
        payloadSeq[slot] = sequenceChecks[slot];
      }
    }

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: quiz.attempt.id,
          answers: payloadAnswers,
          sequenceChecks: payloadSeq,
          cmid: moduleId,
          hasEssayQuestions: hasEssay,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit quiz.");
        setSubmitting(false);
        return;
      }

      setResult({ passed: data.passed, grade: data.grade });
      setPhase("review");
      if (data.passed) {
        onComplete?.();
        router.refresh();
      }
    } catch (err) {
      console.error("[QuizPlayer] Submit error:", err);
      setErrorMsg("Network error while submitting quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Clean Moodle question HTML by removing status bars, grades, form inputs,
   * and other Moodle UI chrome, keeping only the actual question content.
   */
  function sanitizeQuestionHtml(html: string) {
    if (typeof window === "undefined") return html;
    const container = document.createElement("div");
    container.innerHTML = html;

    // Extract .qtext FIRST — it lives inside .formulation which we remove below
    const qtext = container.querySelector(".qtext");
    if (qtext) {
      return qtext.innerHTML;
    }

    // Remove Moodle UI chrome elements by class name
    const removeClasses = [
      "info",           // status bar (Not yet answered, Marked out of X)
      "grade",          // grade display
      "state",          // state text
      "ablock",         // Moodle's native answer block (we render our own)
      "formulation",    // sometimes wraps the whole question with extra chrome
      "qtype",          // question type label
    ];
    removeClasses.forEach((cls) => {
      container.querySelectorAll(`.${cls}`).forEach((el) => el.remove());
    });

    // Remove any remaining input/select/textarea/button elements
    container.querySelectorAll("input, select, textarea, button").forEach((el) => el.remove());
    container.querySelectorAll("script").forEach((el) => el.remove());

    return container.innerHTML;
  }

  if (phase === "loading") {
    return (
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            minHeight: "clamp(200px, 50vw, 300px)",
            background: "#0d1526",
            borderRadius: "1rem",
            overflow: "hidden",
            border: "1px solid #2d3a4f",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
          }}
        >
          <Loader2 size={28} style={{ color: "#F59E0B", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>Loading quiz…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "1rem",
            padding: "clamp(0.875rem, 3vw, 1.25rem) clamp(1rem, 4vw, 1.5rem)",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.875rem",
          }}
        >
          <AlertCircle size={20} style={{ color: "#EF4444", flexShrink: 0, marginTop: "0.125rem" }} />
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "#F9FAFB",
                margin: "0 0 0.25rem",
              }}
            >
              Couldn&apos;t load quiz
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "review" && result) {
    const passed = result.passed;
    return (
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            background: passed ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
            border: `1px solid ${passed ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
            borderRadius: "1rem",
            padding: "clamp(1.25rem, 5vw, 2rem)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "1rem",
              background: passed ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
              border: `1px solid ${passed ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {passed ? (
              <Trophy size={26} style={{ color: "#10B981" }} />
            ) : (
              <AlertCircle size={26} style={{ color: "#F59E0B" }} />
            )}
          </div>
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1rem, 4vw, 1.25rem)",
                color: "#F9FAFB",
                margin: "0 0 0.25rem",
              }}
            >
              {passed ? "Quiz submitted!" : "Quiz finished"}
            </p>
            <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>
              {passed
                ? `You scored ${result.grade} points. Great work!`
                : `You scored ${result.grade} points. You can try again if you want.`}
            </p>
          </div>
          <button
            onClick={() => {
              setAnswers({});
              setResult(null);
              loadQuiz(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              color: "#111827",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: 700,
              fontSize: "0.9375rem",
              padding: "0.75rem clamp(1.25rem, 4vw, 1.5rem)",
              borderRadius: "0.75rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={16} /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (phase !== "ready" || !quiz || !quiz.questions) return null;

  const totalQuestions = quiz.questions.length;
  const answeredCount = quiz.questions.filter(
    (q) => q.type === "essay" || answers[q.slot]
  ).length;

  return (
    <div style={{ marginBottom: "2rem" }}>
      {/* Quiz card */}
      <div
        style={{
          background: "#1C2333",
          border: "1px solid #2d3a4f",
          borderRadius: "1rem",
          padding: "clamp(1rem, 4vw, 1.5rem)",
        }}
      >
        {/* Quiz header */}
        <div style={{ marginBottom: "clamp(1rem, 3vw, 1.5rem)" }}>
          <h3
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1rem, 3.5vw, 1.125rem)",
              color: "#F9FAFB",
              margin: "0 0 0.5rem",
            }}
          >
            {quiz.quiz.name && quiz.quiz.name !== "Quiz" ? quiz.quiz.name : moduleName}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#9CA3AF",
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: "2rem",
                padding: "0.125rem 0.625rem",
              }}
            >
              {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: answeredCount === totalQuestions ? "#10B981" : "#F59E0B",
                fontWeight: 600,
              }}
            >
              {answeredCount} of {totalQuestions} answered
            </span>
          </div>
          {/* Progress bar */}
          <div
            style={{
              marginTop: "0.625rem",
              height: "0.375rem",
              background: "#0d1526",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(answeredCount / totalQuestions) * 100}%`,
                background: "linear-gradient(90deg, #F59E0B, #D97706)",
                borderRadius: "9999px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Intro */}
        {quiz.quiz.intro && (
          <div
            style={{
              fontSize: "0.875rem",
              color: "#9CA3AF",
              marginBottom: "1.5rem",
              lineHeight: 1.5,
            }}
            dangerouslySetInnerHTML={{ __html: quiz.quiz.intro }}
          />
        )}

        {/* Questions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(0.875rem, 3vw, 1.5rem)" }}>
          {quiz.questions.map((q, idx) => {
            const choices = q.options?.answers ?? [];
            const selected = answers[q.slot];
            const isAnswered = q.type === "essay" || !!selected;

            return (
              <div
                key={q.slot}
                style={{
                  background: "#0d1526",
                  border: `1px solid ${isAnswered ? "rgba(16,185,129,0.2)" : "#2d3a4f"}`,
                  borderRadius: "0.75rem",
                  padding: "clamp(0.875rem, 3vw, 1.25rem)",
                  transition: "border-color 0.2s ease",
                }}
              >
                {/* Question number + text */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "clamp(0.75rem, 2vw, 1rem)" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "clamp(24px, 7vw, 28px)",
                      height: "clamp(24px, 7vw, 28px)",
                      borderRadius: "0.5rem",
                      background: isAnswered ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                      border: isAnswered ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(245,158,11,0.25)",
                      color: isAnswered ? "#10B981" : "#F59E0B",
                      fontSize: "clamp(0.75rem, 2.5vw, 0.8125rem)",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isAnswered ? "✓" : idx + 1}
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontWeight: 600,
                      fontSize: "clamp(0.875rem, 3vw, 0.9375rem)",
                      color: "#F9FAFB",
                      lineHeight: 1.5,
                      flex: 1,
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeQuestionHtml(q.html) || "Question" }}
                  />
                </div>

                {/* Answer controls */}
                {q.type === "essay" ? (
                  <textarea
                    value={answers[q.slot] ?? ""}
                    onChange={(e) => handleSelect(q.slot, e.target.value)}
                    placeholder="Type your answer here…"
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.875rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #2d3a4f",
                      background: "#0B1221",
                      color: "#E5E7EB",
                      fontSize: "16px",
                      lineHeight: 1.6,
                      resize: "vertical",
                      outline: "none",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#2d3a4f"; }}
                  />
                ) : choices.length > 0 ? (
                  <div
                    role="radiogroup"
                    aria-label={`Question ${idx + 1}`}
                    style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingLeft: "clamp(0.5rem, 6vw, 2.5rem)" }}
                  >
                    {choices.map((choice) => {
                      const isSelected = selected === String(choice.id);
                      return (
                        <label
                          key={choice.id}
                          onClick={() => handleSelect(q.slot, String(choice.id))}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelect(q.slot, String(choice.id));
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.625rem",
                            padding: "0.625rem 0.75rem",
                            borderRadius: "0.5rem",
                            border: `1px solid ${isSelected ? "rgba(245,158,11,0.4)" : "#2d3a4f"}`,
                            background: isSelected ? "rgba(245,158,11,0.08)" : "transparent",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            color: "#E5E7EB",
                            transition: "all 0.15s ease",
                            userSelect: "none",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = "#2d3a4f";
                          }}
                        >
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              border: `2px solid ${isSelected ? "#F59E0B" : "#4B5563"}`,
                              background: isSelected ? "#F59E0B" : "transparent",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.15s ease",
                            }}
                          >
                            {isSelected && (
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: "#111827",
                                }}
                              />
                            )}
                          </span>
                          <span dangerouslySetInnerHTML={{ __html: choice.text }} />
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.8125rem", color: "#6B7280", paddingLeft: "clamp(0.5rem, 6vw, 2.5rem)" }}>
                    This question type ({q.type}) is not supported in the simplified quiz view.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {errorMsg && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "0.5rem",
              color: "#EF4444",
              fontSize: "0.8125rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            marginTop: "1.5rem",
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            background: submitting ? "#374151" : "linear-gradient(135deg, #F59E0B, #D97706)",
            color: "#111827",
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 700,
            fontSize: "clamp(0.875rem, 3vw, 0.9375rem)",
            padding: "0.875rem clamp(1.25rem, 4vw, 1.5rem)",
            borderRadius: "0.75rem",
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              Submitting…
            </>
          ) : (
            <>
              <CheckCircle2 size={18} /> Submit Quiz
            </>
          )}
        </button>
      </div>
    </div>
  );
}
