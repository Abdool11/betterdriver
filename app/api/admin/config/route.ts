import { NextRequest, NextResponse } from "next/server";
import { getBDAdminSession } from "@/lib/auth";
import { setConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getBDAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { key, value } = body as { key: string; value: string };

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    // Only allow BD-prefixed keys to prevent overwriting TAG/GFA config
    if (!key.startsWith("bd_")) {
      return NextResponse.json({ error: "Key must start with bd_" }, { status: 400 });
    }

    await setConfig(key, typeof value === "string" ? value : "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[BD config save error]", err);
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }
}
