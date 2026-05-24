export const dynamic = "force-dynamic";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import EnquiriesClient from "./EnquiriesClient";

export const metadata = { title: "Enquiry Inbox — TAG Admin" };

export default async function EnquiriesPage() {
  await requireAdminSession();

  const { data: enquiries } = await supabaseAdmin
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  return <EnquiriesClient enquiries={enquiries ?? []} />;
}
