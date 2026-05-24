"use client";

import ConfigForm from "@/components/admin/ConfigForm";

const FIELDS = [
  {
    key: "whatsapp_phone_number_id",
    label: "Phone Number ID",
    placeholder: "123456789012345",
    hint: "Found in Meta Business Manager → WhatsApp → API Setup → Phone Number ID.",
  },
  {
    key: "whatsapp_access_token",
    label: "Access Token",
    type: "password" as const,
    placeholder: "EAAxxxxxxxx...",
    hint: "Permanent access token from your Meta System User. Keep this confidential.",
  },
  {
    key: "whatsapp_welcome_template",
    label: "Driver welcome message template",
    type: "textarea" as const,
    placeholder: "Hello {{driver_name}}, welcome to BetterDriver!...",
    hint: "Available variables: {{driver_name}}, {{programme_name}}, {{portal_link}}, {{company_name}}. This message is sent to each driver when their training is deployed.",
  },
];

export default function WhatsAppClient({ initialValues }: { initialValues: Record<string, string> }) {
  const saveAction = async (data: Record<string, string>) => {
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Save failed");
  };

  return (
    <div>
      <ConfigForm
        title="WhatsApp Cloud API"
        description="Configure your WhatsApp Business credentials for automated driver welcome messages on training deployment. Credentials are stored securely and never exposed to the browser."
        fields={FIELDS}
        initialValues={initialValues}
        saveAction={saveAction}
      />

      {/* Setup guide */}
      <div style={{
        marginTop: "1.5rem",
        background: "#0d1520",
        border: "1px solid rgba(16,185,129,0.15)",
        borderRadius: "0.875rem",
        padding: "1.5rem",
      }}>
        <h3 style={{ color: "#10b981", fontWeight: 600, fontSize: "0.9375rem", margin: "0 0 0.75rem" }}>
          Setup guide
        </h3>
        <ol style={{ color: "#9ca3af", fontSize: "0.8125rem", lineHeight: 1.8, paddingLeft: "1.25rem", margin: 0 }}>
          <li>Go to <strong style={{ color: "#d1d5db" }}>developers.facebook.com</strong> and create a Meta App with WhatsApp product.</li>
          <li>Add a WhatsApp Business Account and register a phone number.</li>
          <li>In API Setup, copy the <strong style={{ color: "#d1d5db" }}>Phone Number ID</strong> (not the phone number itself).</li>
          <li>Create a System User in Business Manager and generate a <strong style={{ color: "#d1d5db" }}>permanent access token</strong> with <code style={{ color: "#10b981" }}>whatsapp_business_messaging</code> permission.</li>
          <li>Paste both values above and save. The platform will use these credentials when Deploy Training is triggered.</li>
        </ol>
      </div>
    </div>
  );
}
