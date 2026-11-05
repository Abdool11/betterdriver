"use client";

import { RefreshCw } from "lucide-react";

type Props = { refreshing: boolean; onRefresh: () => void; error?: string };

export default function ProgressRefreshControl({ refreshing, onRefresh, error }: Props) {
  return (
    <div style={{ margin: "1rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button
        type="button"
        className="btn-secondary"
        disabled={refreshing}
        onClick={onRefresh}
        style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
      >
        <RefreshCw size={16} aria-hidden="true" />
        {refreshing ? "Checking progress…" : "Refresh progress"}
      </button>
      <p role="status" aria-live="polite" style={{ color: error ? "#fca5a5" : "#9CA3AF", fontSize: "0.8125rem", margin: 0 }}>
        {error || "Progress is checked when you return from learning. You can also refresh here without signing out."}
      </p>
    </div>
  );
}
