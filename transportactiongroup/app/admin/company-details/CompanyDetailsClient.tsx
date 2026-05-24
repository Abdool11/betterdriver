"use client";

import ConfigForm from "@/components/admin/ConfigForm";

const FIELDS = [
  { key: "company_legal_name", label: "Legal registered name", placeholder: "Transport Action Group (Pty) Ltd" },
  { key: "company_trading_name", label: "Trading name", placeholder: "Transport Action Group" },
  { key: "company_registration", label: "Company registration number", placeholder: "2024/000000/07" },
  { key: "company_vat_number", label: "VAT registration number", placeholder: "4000000000", hint: "Leave blank if not VAT registered" },
  { key: "company_address_line1", label: "Address line 1", placeholder: "123 Example Street" },
  { key: "company_address_line2", label: "Address line 2", placeholder: "Suite 4" },
  { key: "company_city", label: "City", placeholder: "Durban" },
  { key: "company_province", label: "Province", placeholder: "KwaZulu-Natal" },
  { key: "company_postal_code", label: "Postal code", placeholder: "4001" },
  { key: "company_phone", label: "Contact telephone", placeholder: "+27 31 000 0000" },
  { key: "company_email", label: "Contact email", type: "email" as const, placeholder: "info@transportactiongroup.com" },
  { key: "company_bank_name", label: "Bank name", placeholder: "First National Bank" },
  { key: "company_bank_account", label: "Account number", placeholder: "62000000000" },
  { key: "company_bank_branch", label: "Branch code", placeholder: "250655" },
  { key: "company_bank_type", label: "Account type", type: "select" as const, options: [
    { value: "cheque", label: "Cheque / Current" },
    { value: "savings", label: "Savings" },
  ]},
];

export default function CompanyDetailsClient({ initialValues }: { initialValues: Record<string, string> }) {
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
      title="Company Details"
      description="These details appear on all generated quotations and invoices. Keep them accurate and up to date."
      fields={FIELDS}
      initialValues={initialValues}
      saveAction={saveAction}
    />
  );
}
