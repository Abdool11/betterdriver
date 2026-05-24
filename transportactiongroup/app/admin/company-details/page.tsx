export const dynamic = "force-dynamic";
import { requireAdminSession } from "@/lib/admin-auth";
import { getConfigs, setConfig } from "@/lib/supabase";
import CompanyDetailsClient from "./CompanyDetailsClient";

export const metadata = { title: "Company Details — TAG Admin" };

const KEYS = [
  "company_legal_name", "company_trading_name", "company_registration",
  "company_vat_number", "company_address_line1", "company_address_line2",
  "company_city", "company_province", "company_postal_code",
  "company_phone", "company_email",
  "company_bank_name", "company_bank_account", "company_bank_branch", "company_bank_type",
];

export default async function CompanyDetailsPage() {
  await requireAdminSession();
  const values = await getConfigs(KEYS);
  return <CompanyDetailsClient initialValues={values} />;
}
