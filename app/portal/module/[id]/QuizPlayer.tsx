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
    const unanswered = quiz.questions.filter((q) => !answers[q.slot]);
    if (unanswered.length > 0) {
      setErrorMsg(`Please answer all ${unanswered.length} remaining question(s).`);
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    // Build numeric answers keyed by slot
    const payloadAnswers: Record<string, string | number> = {};
    const payloadSeq: Record<string, number> = {};
    for (const [slot, value] of Object.entries(answers)) {
      const num = parseInt(slot, 10);
      payloadAnswers[num] = value;
      if (sequenceChecks[num] !== undefined) {
        payloadSeq[num] = sequenceChecks[num];
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

    // Extract just the .qtext if it exists (the actual question text)
    const qtext = container.querySelector(".qtext");
    if (qtext) {
      return qtext.innerHTML;
    }

    return container.innerHTML;
  }

  // Strip HTML tags for a plain-text fallback
  function stripHtml(html: string) {
    if (typeof window === "undefined") return html;
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  if (phase === "loading") {
    return (
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            minHeight: 300,
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
            padding: "1.25rem 1.5rem",
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
            padding: "2rem",
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
                fontSize: "1.25rem",
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
              padding: "0.75rem 1.5rem",
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

  return (
    <div style={{ marginBottom: "2rem" }}>
      {/* Quiz card */}
      <div
        style={{
          background: "#1C2333",
          border: "1px solid #2d3a4f",
          borderRadius: "1rem",
          padding: "1.5rem",
        }}
      >
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {quiz.questions.map((q, idx) => {
            const choices = q.options?.answers ?? [];
            const selected = answers[q.slot];

            return (
              <div
                key={q.slot}
                style={{
                  background: "#0d1526",
                  border: "1px solid #2d3a4f",
                  borderRadius: "0.75rem",
                  padding: "1.25rem",
                }}
              >
                {/* Question number + text */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: "0.5rem",
                      background: "rgba(245,158,11,0.12)",
                      border: "1px solid rgba(245,158,11,0.25)",
                      color: "#F59E0B",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontWeight: 600,
                      fontSize: "0.9375rem",
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
                    rows={5}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #2d3a4f",
                      background: "#0B1221",
                      color: "#E5E7EB",
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      resize: "vertical",
                      outline: "none",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#2d3a4f"; }}
                  />
                ) : choices.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingLeft: "2.5rem" }}>
                    {choices.map((choice) => {
                      const isSelected = selected === String(choice.id);
                      return (
                        <label
                          key={choice.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.625rem",
                            padding: "0.625rem 0.875rem",
                            borderRadius: "0.5rem",
                            border: `1px solid ${isSelected ? "rgba(245,158,11,0.4)" : "#2d3a4f"}`,
                            background: isSelected ? "rgba(245,158,11,0.08)" : "transparent",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            color: "#E5E7EB",
                            transition: "all 0.15s ease",
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
                  <p style={{ fontSize: "0.8125rem", color: "#6B7280", paddingLeft: "2.5rem" }}>
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
            fontSize: "0.9375rem",
            padding: "0.875rem 1.5rem",
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
