export const dynamic = "force-dynamic";
import { requireAdminSession } from "@/lib/admin-auth";
import { getConfigs } from "@/lib/supabase";
import WhatsAppClient from "./WhatsAppClient";

export const metadata = { title: "WhatsApp Settings — TAG Admin" };

const KEYS = ["whatsapp_phone_number_id", "whatsapp_access_token", "whatsapp_welcome_template"];

export default async function WhatsAppPage() {
  await requireAdminSession();
  const values = await getConfigs(KEYS);
  return <WhatsAppClient initialValues={values} />;
}
