import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { setConfig } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data: Record<string, string> = await req.json();

  for (const [key, value] of Object.entries(data)) {
    await setConfig(key, value);
  }

  return NextResponse.json({ ok: true });
}
