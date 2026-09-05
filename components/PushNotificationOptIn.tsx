"use client";

import { useEffect, useState } from "react";

function toUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export default function PushNotificationOptIn() {
  const [featureEnabled, setFeatureEnabled] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/portal/push-subscription", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { enabled: false })
      .then((data) => setFeatureEnabled(data.enabled === true))
      .catch(() => setFeatureEnabled(false));
  }, []);

  if (featureEnabled !== true || typeof window === "undefined" || !("PushManager" in window)) return null;

  async function enable() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Notifications are off. You will still receive important WhatsApp messages.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setMessage("Notifications are not configured yet. WhatsApp remains active.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toUint8Array(publicKey),
      });
      const response = await fetch("/api/portal/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });
      setMessage(response.ok
        ? "Notifications enabled for training and safety updates."
        : "Could not enable notifications. WhatsApp remains active.");
    } catch {
      setMessage("Could not enable notifications. WhatsApp remains active.");
    }
  }

  return (
    <section style={{ border: "1px solid #99f6e4", background: "#f0fdfa", borderRadius: 12, padding: 14, marginTop: 14 }}>
      <b>Keep safety updates close</b>
      <p style={{ margin: "6px 0", fontSize: 14 }}>Turn on notifications for training reminders and safety briefings. WhatsApp remains your fallback.</p>
      <button onClick={enable} style={{ border: 0, borderRadius: 7, padding: "9px 12px", background: "#0f766e", color: "white", fontWeight: 700 }}>
        Turn on notifications
      </button>
      {message && <p style={{ fontSize: 13, marginBottom: 0 }}>{message}</p>}
    </section>
  );
}
