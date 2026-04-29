"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <p style={{ color: "#EF4444", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</p>
        <p style={{ color: "#6B7280", fontSize: "0.875rem", marginBottom: "1rem" }}>{error.message}</p>
        <button onClick={reset} style={{ background: "#F59E0B", color: "#111827", fontWeight: 700, padding: "0.625rem 1.25rem", borderRadius: "0.625rem", border: "none", cursor: "pointer" }}>
          Try again
        </button>
      </div>
    </div>
  );
}
