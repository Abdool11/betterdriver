import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";


// DATA REQUIREMENTS:
// - No data fetching on this page
// - Form submits to Server Action: /app/login/actions.ts
// - On success: redirect to /portal/tasks
// TODO: Asif — implement Supabase Auth login Server Action
// TODO: Asif — implement "Forgot password" flow (Supabase resetPasswordForEmail)

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your BetterDriver Driver University.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { returnTo?: string };
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", flexDirection: "column" }}>
      <Navigation />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6rem 1.5rem 3rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>
          {/* Logo mark */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: "linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)",
                borderRadius: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                fontSize: "1.25rem",
                color: "#111827",
                margin: "0 auto 1rem",
              }}
            >
              BD
            </div>
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#F9FAFB", marginBottom: "0.375rem" }}>
              Log in to BetterDriver
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: "0.9rem" }}>
              {"Access your training, certificates, and professional record."}
            </p>
          </div>

          {/* Login form */}
          <div
            style={{
              background: "#1C2333",
              border: "1px solid #2d3a4f",
              borderRadius: "1.25rem",
              padding: "2rem",
            }}
          >
            {/* TODO: Asif — implement Supabase Auth login Server Action */}
            {/* Server Action: signInWithPassword({ email, password }) → redirect to /portal/tasks */}
            <form style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#9CA3AF", marginBottom: "0.375rem" }}>
                  Email address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="your@email.com"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "#243044",
                    border: "1px solid #2d3a4f",
                    borderRadius: "0.75rem",
                    color: "#F9FAFB",
                    fontSize: "0.9375rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#9CA3AF" }}>
                    Password *
                  </label>
                  <span style={{ fontSize: "0.8125rem", color: "#6B7280" }}>
                    {/* TODO: Asif — implement forgot-password with Supabase resetPasswordForEmail */}
                    Forgot password?
                  </span>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "#243044",
                    border: "1px solid #2d3a4f",
                    borderRadius: "0.75rem",
                    color: "#F9FAFB",
                    fontSize: "0.9375rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Log in <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ borderTop: "1px solid #2d3a4f", marginTop: "1.5rem", paddingTop: "1.5rem" }}>
              <div
                style={{
                  background: "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.18)",
                  borderRadius: "0.75rem",
                  padding: "0.875rem 1rem",
                }}
              >
                <p style={{ color: "#9CA3AF", fontSize: "0.8125rem", lineHeight: 1.5, margin: 0 }}>
                  <span style={{ color: "#F59E0B", fontWeight: 600 }}>New to BetterDriver?</span>{" "}
                  Check your SMS or WhatsApp for your personal activation link sent by your company. Tap the link to set up your account.
                </p>
              </div>
            </div>
          </div>

          <p style={{ textAlign: "center", color: "#4B5563", fontSize: "0.8125rem", marginTop: "1.5rem" }}>
            Having trouble logging in?{" "}
            <Link href="/help" style={{ color: "#6B7280", textDecoration: "none" }}>
              Visit Help
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
