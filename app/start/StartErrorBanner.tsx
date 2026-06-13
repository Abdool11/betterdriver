"use client";

import { useSearchParams } from "next/navigation";
import { AlertTriangle, ShieldOff, Clock } from "lucide-react";

const ERROR_MESSAGES: Record<string, { icon: React.ElementType; title: string; body: string; color: string }> = {
  "invalid-link": {
    icon: AlertTriangle,
    title: "Invalid activation link",
    body: "This link does not match any active invitation. Please check the link in your WhatsApp or SMS message, or ask your fleet manager to resend it.",
    color: "#ef4444",
  },
  "link-deactivated": {
    icon: ShieldOff,
    title: "This link has been deactivated",
    body: "Your fleet manager has deactivated this link. Please contact your HR department or fleet manager to request a new one.",
    color: "#f59e0b",
  },
  "link-expired": {
    icon: Clock,
    title: "This link has expired",
    body: "Your activation link has passed its expiry date. Please ask your fleet manager to resend your invitation through the Green Freight Academy.",
    color: "#f59e0b",
  },
  "missing-token": {
    icon: AlertTriangle,
    title: "No activation link found",
    body: "Please tap the full link sent to you via WhatsApp or SMS. Do not type the URL manually.",
    color: "#ef4444",
  },
};

export default function StartErrorBanner() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  if (!errorCode) return null;

  const msg = ERROR_MESSAGES[errorCode];
  if (!msg) return null;

  const Icon = msg.icon;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.875rem",
        padding: "1rem 1.25rem",
        background: `${msg.color}14`,
        border: `1px solid ${msg.color}40`,
        borderRadius: "0.875rem",
        marginBottom: "1.5rem",
      }}
    >
      <Icon size={20} style={{ color: msg.color, flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
          {msg.title}
        </p>
        <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0, lineHeight: 1.5 }}>
          {msg.body}
        </p>
      </div>
    </div>
  );
}
