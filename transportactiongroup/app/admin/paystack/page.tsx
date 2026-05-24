export const dynamic = "force-dynamic";
import { requireAdminSession } from "@/lib/admin-auth";
import { getConfigs } from "@/lib/supabase";
import PaystackClient from "./PaystackClient";

export const metadata = { title: "Paystack Settings — TAG Admin" };

const KEYS = ["paystack_public_key", "paystack_secret_key", "paystack_webhook_secret", "paystack_mode"];

export default async function PaystackPage() {
  await requireAdminSession();
  const values = await getConfigs(KEYS);
  return <PaystackClient initialValues={values} />;
}
