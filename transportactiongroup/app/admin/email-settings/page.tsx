export const dynamic = "force-dynamic";
import { requireAdminSession } from "@/lib/admin-auth";
import { getConfigs } from "@/lib/supabase";
import EmailSettingsClient from "./EmailSettingsClient";

export const metadata = { title: "Email Settings — TAG Admin" };

const KEYS = ["email_enquiry_to", "email_booking_to", "email_deployment_to", "email_from_name"];

export default async function EmailSettingsPage() {
  await requireAdminSession();
  const values = await getConfigs(KEYS);
  return <EmailSettingsClient initialValues={values} />;
}
