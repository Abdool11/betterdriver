import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import TCOSubmissionsClient from "./TCOSubmissionsClient";

export const dynamic = "force-dynamic";

export default async function TCOSubmissionsPage() {
  const session = await requireAdminSession();
  if (!session) redirect("/admin/login");

  const { data: submissions, error } = await supabaseAdmin
    .from("tco_submissions")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Failed to load TCO submissions:", error);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <TCOSubmissionsClient initialSubmissions={submissions ?? []} />
    </div>
  );
}
