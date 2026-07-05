import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getBDAdminSession } from "@/lib/auth";
import { getConfigs } from "@/lib/supabase";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings — BetterDriver Admin" };

export default async function SettingsPage() {
  const session = await getBDAdminSession();
  if (!session) redirect("/admin/login");

  const config = await getConfigs([
    "bd_support_email",
    "bd_support_phone",
    "bd_whatsapp_number",
  ]);

  return (
    <SettingsClient
      initialValues={{
        bd_support_email: config["bd_support_email"] ?? "",
        bd_support_phone: config["bd_support_phone"] ?? "",
        bd_whatsapp_number: config["bd_whatsapp_number"] ?? "",
      }}
    />
  );
}
