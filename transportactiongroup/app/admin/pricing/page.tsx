export const dynamic = "force-dynamic";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabaseAdmin, getConfig } from "@/lib/supabase";
import PricingClient from "./PricingClient";

export const metadata = { title: "Programme Pricing — TAG Admin" };

export default async function PricingPage() {
  await requireAdminSession();

  const { data: courses } = await supabaseAdmin
    .from("courses")
    .select("*")
    .order("sort_order");

  const vatRate = await getConfig("vat_rate");
  const vatEnabled = await getConfig("vat_enabled");

  return (
    <PricingClient
      courses={courses ?? []}
      vatRate={vatRate}
      vatEnabled={vatEnabled === "true"}
    />
  );
}
