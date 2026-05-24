export const dynamic = "force-dynamic";
import { requireAdminSession } from "@/lib/admin-auth";
import { getConfigs } from "@/lib/supabase";
import StatsAdminClient from "./StatsAdminClient";

export const metadata = { title: "Impact Stats — TAG Admin" };

export default async function StatsAdminPage() {
  await requireAdminSession();
  const values = await getConfigs([
    "stat_workshops",
    "stat_workshops_use_live",
    "stat_training_seats",
    "stat_training_seats_use_live",
    "stat_certifications",
    "stat_certifications_use_live",
    "stat_companies",
    "stat_companies_use_live",
  ]);
  // Set sensible defaults if not yet configured
  const defaults: Record<string, string> = {
    stat_workshops: "34",
    stat_workshops_use_live: "false",
    stat_training_seats: "252",
    stat_training_seats_use_live: "false",
    stat_certifications: "207",
    stat_certifications_use_live: "false",
    stat_companies: "7",
    stat_companies_use_live: "false",
  };
  const merged = { ...defaults, ...values };
  return <StatsAdminClient initialValues={merged} />;
}
