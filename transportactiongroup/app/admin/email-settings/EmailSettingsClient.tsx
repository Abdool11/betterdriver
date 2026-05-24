"use client";

import ConfigForm from "@/components/admin/ConfigForm";

const FIELDS = [
  {
    key: "email_from_name",
    label: "From name",
    placeholder: "Transport Action Group",
    hint: "The name that appears in the From field of all outbound emails.",
  },
  {
    key: "email_enquiry_to",
    label: "TAG partnership enquiry notifications",
    type: "email" as const,
    placeholder: "durbanroadtransport@gmail.com",
    hint: "Receives an email every time a partnership or contact enquiry is submitted on the TAG site.",
  },
  {
    key: "email_booking_to",
    label: "GFA booking notifications",
    type: "email" as const,
    placeholder: "durbanroadtransport@gmail.com",
    hint: "Receives an email every time a company submits a booking or training enquiry on GFA.",
  },
  {
    key: "email_deployment_to",
    label: "Training deployment confirmations",
    type: "email" as const,
    placeholder: "durbanroadtransport@gmail.com",
    hint: "Receives a confirmation email when a company clicks Deploy Training after payment.",
  },
];

export default function EmailSettingsClient({ initialValues }: { initialValues: Record<string, string> }) {
  const saveAction = async (data: Record<string, string>) => {
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Save failed");
  };

  return (
    <ConfigForm
      title="Email Settings"
      description="Configure where notification emails are sent for each type of platform event. All addresses can be updated at any time without redeploying the site."
      fields={FIELDS}
      initialValues={initialValues}
      saveAction={saveAction}
    />
  );
}
