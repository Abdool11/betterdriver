export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { signAdminToken, ADMIN_COOKIE, getAdminSession } from "@/lib/admin-auth";

export const metadata = { title: "Admin Login — TAG" };

async function loginAction(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const adminEmail = process.env.ADMIN_EMAIL ?? "durbanroadtransport@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme";

  if (email !== adminEmail || password !== adminPassword) {
    redirect("/admin/login?error=1");
  }

  const token = await signAdminToken(email);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
  redirect("/admin/dashboard");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  if (session) redirect("/admin/dashboard");

  const resolvedParams = await searchParams;
  const hasError = resolvedParams.error === "1";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: "1.5rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#0d1520",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1rem",
        padding: "2.5rem",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 48, height: 48,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            borderRadius: "0.75rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem",
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ color: "#f9fafb", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>TAG Admin</h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>System configuration portal</p>
        </div>

        {hasError && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            color: "#fca5a5",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
          }}>
            Incorrect email or password. Please try again.
          </div>
        )}

        <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", color: "#9ca3af", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.375rem" }}>
              Email address
            </label>
            <input
              type="email"
              name="email"
              required
              style={{
                width: "100%",
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
                padding: "0.625rem 0.875rem",
                color: "#f9fafb",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", color: "#9ca3af", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.375rem" }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              style={{
                width: "100%",
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
                padding: "0.625rem 0.875rem",
                color: "#f9fafb",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "0.5rem",
            }}
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
