"use client";

// Legacy /activate?token=... route — redirects to the new /join/[token] route.
// Kept for backward compatibility with any existing WhatsApp links already sent.

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ActivateLegacyRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token") ?? "";

  useEffect(() => {
    if (token) {
      // Redirect to the new magic link handler
      router.replace(`/api/join/${encodeURIComponent(token)}`);
    } else {
      router.replace("/start?error=missing-token");
    }
  }, [token, router]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
      }}
    >
      <Loader2
        size={32}
        style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }}
      />
      <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
        Activating your account…
      </p>
    </div>
  );
}
