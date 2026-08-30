import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const pushEnabled = () => process.env.ENABLE_PUSH_NOTIFICATIONS === "true";

export async function GET() {
  return NextResponse.json({ enabled: pushEnabled() });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!pushEnabled()) return NextResponse.json({ error: "Push notifications are disabled for this release." }, { status: 503 });

  const body = await req.json();
  const subscription = body.subscription;
  if (!subscription || typeof subscription.endpoint !== "string") return NextResponse.json({ error: "A valid browser subscription is required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("driver_push_subscriptions").upsert({
    driver_id: session.driverId,
    endpoint: subscription.endpoint,
    subscription,
    enabled: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Could not save notification preference" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!pushEnabled()) return NextResponse.json({ error: "Push notifications are disabled for this release." }, { status: 503 });

  const endpoint = new URL(req.url).searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
  await supabaseAdmin.from("driver_push_subscriptions").update({ enabled: false, updated_at: new Date().toISOString() }).eq("driver_id", session.driverId).eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
