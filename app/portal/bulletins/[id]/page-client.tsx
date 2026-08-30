"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";


import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Shield,
  ThumbsUp,
  HelpCircle,
  ArrowRight,
  Clock,
} from "lucide-react";

type FlowStep = "reading" | "acknowledge" | "check" | "feedback" | "done";

interface Question {
  id?: string;
  question: string;
  options: string[];
  correct: number;
}

interface BulletinData {
  id: string;
  title: string;
  category: string;
  urgency: "urgent" | "standard";
  description: string;
  why_it_matters: string;
  mitigation: string;
  driver_action: string;
  sender_company: string;
  disseminated_at: string;
  questions: Question[];
}

// Mock data — replace with live API call
const MOCK_BULLETIN: BulletinData = {
  id: "b-001",
  title: "Tyre blowout response — updated procedure",
  category: "Safety",
  urgency: "urgent",
  description:
    "Three incidents on the N3 in the past 30 days have involved tyre blowouts at highway speed. In each case, the driver's response in the first 3 seconds determined the outcome. This bulletin updates the recommended response procedure based on what we learned from those incidents.",
  why_it_matters:
    "A blowout at speed creates an immediate steering pull. The instinct to brake hard is the most dangerous response — it transfers weight to the front axle and worsens the pull. Knowing the correct response before it happens is the difference between a controlled stop and a rollover.",
  mitigation:
    "When a blowout occurs: (1) Grip the wheel firmly with both hands. (2) Do NOT brake immediately — maintain throttle briefly to stabilise. (3) Steer gently to correct the pull. (4) Gradually reduce speed. (5) Move to the shoulder only when speed is below 60 km/h. (6) Activate hazards and call dispatch.",
  driver_action:
    "Read this bulletin fully. Complete the understanding check. If you have questions or have experienced a similar incident, use the feedback section to share it.",
  sender_company: "Transnet Freight",
  disseminated_at: "2025-04-18T08:00:00Z",
  questions: [
    {
      question: "What is the FIRST thing you should do when a tyre blows out at highway speed?",
      options: [
        "Brake hard immediately to slow down",
        "Grip the wheel firmly and maintain throttle briefly",
        "Steer immediately to the shoulder",
        "Call dispatch before doing anything",
      ],
      correct: 1,
    },
    {
      question: "At what speed is it safe to move to the shoulder after a blowout?",
      options: ["Below 100 km/h", "Below 80 km/h", "Below 60 km/h", "As soon as possible"],
      correct: 2,
    },
    {
      question: "Why should you NOT brake hard immediately after a blowout?",
      options: [
        "It wastes fuel",
        "It transfers weight to the front axle and worsens the pull",
        "It damages the brake pads",
        "It is against traffic regulations",
      ],
      correct: 1,
    },
  ],
};

const STEP_ORDER: FlowStep[] = ["reading", "acknowledge", "check", "feedback", "done"];

export default function BulletinReadPage() {
  const { id = "" } = useParams<{ id: string }>() ?? {};
  const router = useRouter();
  const bulletin = MOCK_BULLETIN; // Replace with fetch by id

  const [step, setStep] = useState<FlowStep>("reading");
  const [answers, setAnswers] = useState<(number | null)[]>(Array(bulletin.questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const stepIndex = STEP_ORDER.indexOf(step);
  const progress = ((stepIndex) / (STEP_ORDER.length - 1)) * 100;

  function advance() {
    const next = STEP_ORDER[stepIndex + 1];
    if (next) setStep(next);
  }

  function submitCheck() {
    const correct = answers.filter((a, i) => a === bulletin.questions[i].correct).length;
    setScore(correct);
    setSubmitted(true);
  }

  async function submitFeedback() {
    setFeedbackSubmitted(true);
    // Post completed interaction to GFA campaign reporting
    try {
      await fetch("/api/bulletin-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: "demo-driver", // replaced with real session driver_id in production
          bulletin_id: bulletin.id,
          status: "completed",
          answers: bulletin.questions.map((q, i) => ({
            question_id: q.id,
            answer: answers[i] ?? null,
            is_correct: answers[i] === q.correct,
          })),
          feedback_text: feedbackComment || null,
          feedback_rating: feedbackType || null,
        }),
      });
    } catch (e) {
      // Non-blocking — driver UX continues regardless
      console.warn("[BD] GFA interaction sync failed:", e);
    }
    setTimeout(() => advance(), 800);
  }

  const isUrgent = bulletin.urgency === "urgent";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, minHeight: "100%" }}>
      {/* Back nav */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/portal/bulletins"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          <ChevronLeft size={16} /> Back to bulletins
        </Link>
      </div>

      {/* Progress bar */}
      {step !== "done" && (
        <div
          style={{
            height: "3px",
            background: "var(--border)",
            borderRadius: "9999px",
            marginBottom: "1.25rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: isUrgent ? "var(--danger)" : "var(--amber)",
              borderRadius: "9999px",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      )}

      {/* ── STEP: READING ── */}
      {step === "reading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Header */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
              {isUrgent && (
                <span className="badge badge-danger">
                  <AlertTriangle size={10} /> Urgent
                </span>
              )}
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  background: "var(--bg-elevated)",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "9999px",
                }}
              >
                {bulletin.category}
              </span>
            </div>
            <h2 style={{ fontSize: "1.125rem", lineHeight: 1.4, marginBottom: "0.375rem" }}>
              {bulletin.title}
            </h2>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              From {bulletin.sender_company} ·{" "}
              {new Date(bulletin.disseminated_at).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Content blocks */}
          <div className="card">
            <div className="section-label" style={{ marginBottom: "0.625rem" }}>
              <Shield size={11} /> What happened
            </div>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>
              {bulletin.description}
            </p>
          </div>

          <div className="card">
            <div className="section-label" style={{ marginBottom: "0.625rem" }}>
              <HelpCircle size={11} /> Why it matters to you
            </div>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>
              {bulletin.why_it_matters}
            </p>
          </div>

          <div className={isUrgent ? "card-danger" : "card-amber"}>
            <div className="section-label" style={{ marginBottom: "0.625rem" }}>
              <CheckCircle2 size={11} /> What to do
            </div>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>
              {bulletin.mitigation}
            </p>
          </div>

          <div className="card" style={{ background: "var(--bg-elevated)", border: "none" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
              {bulletin.driver_action}
            </p>
          </div>

          <button className="btn btn-primary btn-full" onClick={advance} style={{ justifyContent: "center" }}>
            I have read this bulletin
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── STEP: ACKNOWLEDGE ── */}
      {step === "acknowledge" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                background: "var(--amber-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <ThumbsUp size={28} style={{ color: "var(--amber)" }} />
            </div>
            <h2 style={{ marginBottom: "0.5rem" }}>Acknowledge this bulletin</h2>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "28rem", margin: "0 auto" }}>
              By acknowledging, you confirm that you have read and understood the content of this bulletin.
            </p>
          </div>

          <div className="card" style={{ background: "var(--bg-elevated)", border: "none" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
              Your acknowledgement is recorded and visible to your company.
            </p>
          </div>

          <button className="btn btn-primary btn-full" onClick={advance} style={{ justifyContent: "center" }}>
            <CheckCircle2 size={16} />
            I acknowledge this bulletin
          </button>
          <button
            className="btn btn-full"
            onClick={advance}
            style={{
              justifyContent: "center",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            Skip acknowledgement
          </button>
        </div>
      )}

      {/* ── STEP: UNDERSTANDING CHECK ── */}
      {step === "check" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <div className="section-label" style={{ marginBottom: "0.75rem" }}>
              <HelpCircle size={12} /> Understanding check
            </div>
            <h2 style={{ marginBottom: "0.25rem" }}>Quick check</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              {bulletin.questions.length} question{bulletin.questions.length > 1 ? "s" : ""} — there are no wrong answers that affect your record. This helps us improve future bulletins.
            </p>
          </div>

          {bulletin.questions.map((q, qi) => (
            <div key={qi} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem", lineHeight: 1.5, color: "var(--text-primary)" }}>
                {qi + 1}. {q.question}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {q.options.map((opt, oi) => {
                  const isSelected = answers[qi] === oi;
                  const isCorrect = submitted && oi === q.correct;
                  const isWrong = submitted && isSelected && oi !== q.correct;
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => {
                        const next = [...answers];
                        next[qi] = oi;
                        setAnswers(next);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.75rem",
                        border: "1.5px solid",
                        borderColor: isCorrect
                          ? "var(--success)"
                          : isWrong
                          ? "var(--danger)"
                          : isSelected
                          ? "var(--amber)"
                          : "var(--border)",
                        background: isCorrect
                          ? "var(--success-subtle)"
                          : isWrong
                          ? "rgba(239,68,68,0.08)"
                          : isSelected
                          ? "var(--amber-subtle)"
                          : "transparent",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        textAlign: "left",
                        cursor: submitted ? "default" : "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                          borderRadius: "50%",
                          border: "2px solid",
                          borderColor: isCorrect
                            ? "var(--success)"
                            : isWrong
                            ? "var(--danger)"
                            : isSelected
                            ? "var(--amber)"
                            : "var(--border)",
                          background: isSelected ? (isCorrect ? "var(--success)" : isWrong ? "var(--danger)" : "var(--amber)") : "transparent",
                          flexShrink: 0,
                        }}
                      />
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {!submitted ? (
            <button
              className="btn btn-primary btn-full"
              onClick={submitCheck}
              disabled={answers.some((a) => a === null)}
              style={{ justifyContent: "center", opacity: answers.some((a) => a === null) ? 0.5 : 1 }}
            >
              Submit answers
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div
                className="card"
                style={{
                  textAlign: "center",
                  background: score === bulletin.questions.length ? "var(--success-subtle)" : "var(--amber-subtle)",
                  border: `1px solid ${score === bulletin.questions.length ? "var(--success)" : "var(--amber)"}`,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "1.25rem", color: score === bulletin.questions.length ? "var(--success)" : "var(--amber)" }}>
                  {score}/{bulletin.questions.length} correct
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {score === bulletin.questions.length
                    ? "Excellent — you know this material well."
                    : "Good effort. Review the correct answers above before continuing."}
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={advance} style={{ justifyContent: "center" }}>
                Continue <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP: FEEDBACK ── */}
      {step === "feedback" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <div className="section-label" style={{ marginBottom: "0.75rem" }}>
              <MessageSquare size={12} /> Optional feedback
            </div>
            <h2 style={{ marginBottom: "0.25rem" }}>Share your experience</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Your feedback helps improve future bulletins and CPD content. This is optional.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { value: "experienced_similar", label: "I have experienced something similar" },
              { value: "useful", label: "This was useful and relevant" },
              { value: "needs_more_detail", label: "I would like more detail on this topic" },
              { value: "not_relevant", label: "This is not relevant to my route or role" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFeedbackType(feedbackType === opt.value ? "" : opt.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1.5px solid",
                  borderColor: feedbackType === opt.value ? "var(--amber)" : "var(--border)",
                  background: feedbackType === opt.value ? "var(--amber-subtle)" : "transparent",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "1.125rem",
                    height: "1.125rem",
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: feedbackType === opt.value ? "var(--amber)" : "var(--border)",
                    background: feedbackType === opt.value ? "var(--amber)" : "transparent",
                    flexShrink: 0,
                  }}
                />
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label style={{ fontSize: "0.8125rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
              Additional comment (optional)
            </label>
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Share any additional context or experience..."
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                border: "1.5px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={submitFeedback}
            disabled={feedbackSubmitted}
            style={{ justifyContent: "center" }}
          >
            {feedbackSubmitted ? <><CheckCircle2 size={16} /> Submitted</> : <>Submit feedback <ArrowRight size={16} /></>}
          </button>
          <button
            onClick={advance}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              cursor: "pointer",
              textDecoration: "underline",
              padding: "0.25rem",
            }}
          >
            Skip — no feedback
          </button>
        </div>
      )}

      {/* ── STEP: DONE ── */}
      {step === "done" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "2rem 0", textAlign: "center" }}>
          <div
            style={{
              width: "5rem",
              height: "5rem",
              borderRadius: "50%",
              background: "var(--success-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={36} style={{ color: "var(--success)" }} />
          </div>
          <div>
            <h2 style={{ marginBottom: "0.5rem" }}>Bulletin completed</h2>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "28rem" }}>
              Your record has been updated. Thank you for taking the time to read and engage with this bulletin.
            </p>
          </div>
          <div className="card" style={{ width: "100%", textAlign: "left" }}>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.625rem" }}>Your record for this bulletin</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { label: "Read", done: true },
                { label: "Acknowledged", done: true },
                { label: "Understanding check", done: score !== null },
                { label: "Feedback", done: feedbackSubmitted },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <CheckCircle2 size={15} style={{ color: item.done ? "var(--success)" : "var(--border)" }} />
                  <span style={{ fontSize: "0.875rem", color: item.done ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/portal/bulletins" className="btn btn-primary btn-full" style={{ justifyContent: "center" }}>
            Back to bulletins
          </Link>
          <Link href="/portal" style={{ color: "var(--text-muted)", fontSize: "0.875rem", textDecoration: "underline" }}>
            Go to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
