import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { supabaseAdmin, setConfig } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courses, vatRate, vatEnabled } = await req.json();

  // Update VAT settings
  await setConfig("vat_rate", vatRate);
  await setConfig("vat_enabled", vatEnabled ? "true" : "false");

  // Update each course price
  for (const course of courses) {
    await supabaseAdmin
      .from("courses")
      .update({
        price_individual: course.price_individual,
        price_corporate: course.price_corporate,
        active: course.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course.id);
  }

  return NextResponse.json({ ok: true });
}
