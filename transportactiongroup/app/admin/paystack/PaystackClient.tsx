"use client";

import ConfigForm from "@/components/admin/ConfigForm";

const FIELDS = [
  {
    key: "paystack_mode",
    label: "Mode",
    type: "select" as const,
    options: [
      { value: "test", label: "Test mode (no real payments)" },
      { value: "live", label: "Live mode (real payments)" },
    ],
    hint: "Use test mode during setup. Switch to live only when ready to accept real payments.",
  },
  {
    key: "paystack_public_key",
    label: "Public key",
    placeholder: "pk_test_xxxxxxxx or pk_live_xxxxxxxx",
    hint: "Used in the browser to initialise the Paystack payment popup.",
  },
  {
    key: "paystack_secret_key",
    label: "Secret key",
    type: "password" as const,
    placeholder: "sk_test_xxxxxxxx or sk_live_xxxxxxxx",
    hint: "Used server-side only to verify payments. Never exposed to the browser.",
  },
  {
    key: "paystack_webhook_secret",
    label: "Webhook secret",
    type: "password" as const,
    placeholder: "whsec_xxxxxxxx",
    hint: "Used to verify that webhook events are genuinely from Paystack.",
  },
];

export default function PaystackClient({ initialValues }: { initialValues: Record<string, string> }) {
  const saveAction = async (data: Record<string, string>) => {
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Save failed");
  };

  const isLive = initialValues.paystack_mode === "live";

  return (
    <div>
      {isLive && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "0.75rem",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          color: "#fca5a5",
          fontSize: "0.875rem",
        }}>
          <strong>Live mode is active.</strong> Real payments are being processed. Ensure your keys are correct before saving.
        </div>
      )}

      <ConfigForm
        title="Paystack Payment Gateway"
        description="Configure your Paystack credentials for individual driver enrolment payments and corporate credit card payments. Credentials are stored securely server-side."
        fields={FIELDS}
        initialValues={initialValues}
        saveAction={saveAction}
      />

      <div style={{
        marginTop: "1.5rem",
        background: "#0d1520",
        border: "1px solid rgba(139,92,246,0.15)",
        borderRadius: "0.875rem",
        padding: "1.5rem",
      }}>
        <h3 style={{ color: "#8b5cf6", fontWeight: 600, fontSize: "0.9375rem", margin: "0 0 0.75rem" }}>
          Webhook configuration
        </h3>
        <p style={{ color: "#9ca3af", fontSize: "0.8125rem", lineHeight: 1.6, margin: "0 0 0.75rem" }}>
          Add the following URL as a webhook endpoint in your Paystack dashboard to automatically activate driver enrolments after payment:
        </p>
        <code style={{
          display: "block",
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "0.375rem",
          padding: "0.625rem 0.875rem",
          color: "#8b5cf6",
          fontSize: "0.8125rem",
          wordBreak: "break-all",
        }}>
          https://www.betterdriver.co.za/api/webhooks/paystack
        </code>
        <p style={{ color: "#4b5563", fontSize: "0.75rem", marginTop: "0.5rem" }}>
          Enable the <strong>charge.success</strong> event. The webhook secret above is used to verify these events.
        </p>
      </div>
    </div>
  );
}
