export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111827",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid #2d3a4f",
            borderTopColor: "#F59E0B",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 1rem",
          }}
        />
        <p style={{ color: "#6B7280", fontSize: "0.9rem" }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
