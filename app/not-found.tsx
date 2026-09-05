export const dynamic = "force-dynamic";

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111827",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 800,
            fontSize: "4rem",
            color: "#F59E0B",
            margin: "0 0 0.5rem",
          }}
        >
          404
        </p>
        <h2
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "1.375rem",
            color: "#F9FAFB",
            marginBottom: "0.75rem",
          }}
        >
          Page not found
        </h2>
        <p style={{ color: "#9CA3AF", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.75rem",
            background: "#F59E0B",
            color: "#111827",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "0.9375rem",
            borderRadius: "9999px",
            textDecoration: "none",
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
