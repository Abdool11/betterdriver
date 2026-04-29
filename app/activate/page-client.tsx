"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";


import {
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ArrowRight,
  Shield,
} from "lucide-react";

type Stage = "loading" | "invalid" | "expired" | "used" | "set_password" | "activating" | "success";

interface DriverInfo {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  needsPassword: boolean;
  profileComplete: boolean;
}

export default function ActivatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [stage, setStage] = useState<Stage>("loading");
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setStage("invalid"); return; }

    fetch(`/api/activate?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          if (data.error.includes("expired")) setStage("expired");
          else if (data.error.includes("already been used")) setStage("used");
          else setStage("invalid");
          return;
        }
        setDriver(data);
        setStage("set_password");
      })
      .catch(() => setStage("invalid"));
  }, [token]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStage("activating");

    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Activation failed. Please try again.");
        setStage("set_password");
        return;
      }

      setStage("success");
      setTimeout(() => router.push(data.redirectTo ?? "/portal/setup"), 1800);
    } catch {
      setError("Something went wrong. Please try again.");
      setStage("set_password");
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100dvh",
    background: "var(--bg-base)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "26rem",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "1rem",
    padding: "2rem 1.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  };

  // ── Loading ──
  if (stage === "loading") {
    return (
      <div style={containerStyle}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <Loader2 size={32} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>Verifying your activation link…</p>
        </div>
      </div>
    );
  }

  // ── Error states ──
  if (stage === "invalid" || stage === "expired" || stage === "used") {
    const messages = {
      invalid: {
        icon: <AlertTriangle size={32} style={{ color: "var(--danger)" }} />,
        title: "Invalid link",
        body: "This activation link is not valid. Please check the link in your message or contact your fleet manager.",
      },
      expired: {
        icon: <AlertTriangle size={32} style={{ color: "var(--amber)" }} />,
        title: "Link expired",
        body: "This activation link has expired (links are valid for 30 days). Please ask your fleet manager to resend your invitation.",
      },
      used: {
        icon: <CheckCircle2 size={32} style={{ color: "var(--success)" }} />,
        title: "Welcome back!",
        body: "Your account is already active. Head to your portal to continue your training.",
      },
    };
    const msg = messages[stage];
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center" }}>
            {msg.icon}
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0.75rem 0 0.5rem", color: "var(--text-primary)" }}>
              {msg.title}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", lineHeight: 1.6 }}>{msg.body}</p>
          </div>
          {stage === "used" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <a
                href="/portal"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  background: "var(--amber)",
                  color: "#0d1526",
                  fontWeight: 700,
                  borderRadius: "0.625rem",
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                }}
              >
                Go to my portal <ArrowRight size={16} />
              </a>
              <a
                href="/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.625rem",
                  background: "transparent",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  borderRadius: "0.625rem",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  border: "1px solid var(--border)",
                }}
              >
                Log in instead
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Success ──
  if (stage === "success") {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, alignItems: "center", textAlign: "center" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "50%",
              background: "rgba(46,204,113,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={32} style={{ color: "var(--success)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
              Welcome, {driver?.firstName}!
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
              Your account is active. Setting up your profile…
            </p>
          </div>
          <Loader2 size={20} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    );
  }

  // ── Set password ──
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              background: "linear-gradient(135deg, var(--amber), var(--amber-dark))",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              fontWeight: 800,
              color: "#0d1526",
              fontSize: "1rem",
            }}
          >
            BD
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.375rem", color: "var(--text-primary)" }}>
            Welcome to BetterDriver
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "0.5rem" }}>
            Hi {driver?.firstName} — set a password to activate your account.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.5, padding: "0.625rem 0.875rem", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: "0.5rem" }}>
            You received this activation link via WhatsApp or email from Green Freight Academy (GFA). This is your personal link — do not share it.
          </p>
        </div>

        {/* Driver info badge */}
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "0.625rem",
            padding: "0.75rem 1rem",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            {driver?.firstName} {driver?.lastName}
          </div>
          <div>{driver?.email}</div>
        </div>

        {/* Password form */}
        <form onSubmit={handleActivate} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
              <Lock size={12} style={{ display: "inline", marginRight: "0.25rem" }} />
              Create password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 2.75rem 0.75rem 0.875rem",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  color: "var(--text-primary)",
                  fontSize: "0.9375rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
              Confirm password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
              style={{
                width: "100%",
                padding: "0.75rem 0.875rem",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                color: "var(--text-primary)",
                fontSize: "0.9375rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 0.875rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "0.5rem",
                color: "#f87171",
                fontSize: "0.875rem",
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={stage === "activating"}
            className="btn btn-primary btn-full"
            style={{ justifyContent: "center", marginTop: "0.25rem" }}
          >
            {stage === "activating" ? (
              <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Activating…</>
            ) : (
              <>Activate my account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Security note */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          <Shield size={13} style={{ flexShrink: 0, marginTop: "0.125rem" }} />
          <span>Your account is secured with a password you control. BetterDriver never shares your personal details.</span>
        </div>
      </div>
    </div>
  );
}
