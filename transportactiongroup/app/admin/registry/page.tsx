export const dynamic = "force-dynamic";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import RegistryClient from "./RegistryClient";

export const metadata = { title: "Driver Registry — TAG Admin" };

export default async function RegistryPage() {
  await requireAdminSession();

  const { data: drivers } = await supabaseAdmin
    .from("drivers")
    .select(`
      *,
      companies(name),
      certifications(
        id,
        certificate_number,
        issue_date,
        status,
        courses(name, slug)
      )
    `)
    .order("created_at", { ascending: false });

  return <RegistryClient drivers={drivers ?? []} />;
}
