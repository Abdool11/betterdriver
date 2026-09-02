import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 3;

function normaliseMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("27")) return `+${digits}`;
  if (digits.startsWith("0")) return `+27${digits.slice(1)}`;
  return `+27${digits}`;
}
function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
const generic = { ok: true, message: "If your mobile number is registered, we will send a secure BetterDriver access link shortly." };

export async function POST(req: NextRequest) {
  const { mobile } = await req.json().catch(() => ({}));
  if (typeof mobile !== "string" || mobile.trim().length < 8) return NextResponse.json(generic);
  const normalised = normaliseMobile(mobile);
  const mobileHash = hash(normalised);
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await supabaseAdmin.from("driver_reaccess_requests").select("id", { count: "exact", head: true }).eq("mobile_hash", mobileHash).gte("requested_at", since);
  if ((count ?? 0) >= MAX_REQUESTS) return NextResponse.json(generic);

  const { data: driver } = await supabaseAdmin.from("drivers").select("id, first_name, last_name, mobile, company_id, language_preference").or(`mobile.eq.${normalised},mobile.eq.${normalised.replace(/^\+/, "")}`).limit(1).maybeSingle();
  const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  let request = { mobile_hash: mobileHash, request_ip_hash: requestIp ? hash(requestIp) : null, delivery_status: "accepted" };
  if (!driver) { await supabaseAdmin.from("driver_reaccess_requests").insert(request); return NextResponse.json(generic); }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: previous } = await supabaseAdmin.from("driver_invitations").select("company_id, deployment_id, programme_slug, program_assignment").eq("driver_id", driver.id).is("revoked_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!previous) { await supabaseAdmin.from("driver_reaccess_requests").insert({ ...request, driver_id: driver.id, company_id: driver.company_id, delivery_status: "no_active_invitation" }); return NextResponse.json(generic); }
  const { error } = await supabaseAdmin.from("driver_invitations").insert({ ...previous, driver_id: driver.id, token, driver_name: `${driver.first_name ?? ""} ${driver.last_name ?? ""}`.trim(), driver_mobile: driver.mobile, status: "pending", expires_at: expiresAt });
  let status = error ? "create_failed" : "sent";
  if (!error && driver.mobile) {
    const sent = await sendWhatsAppMessage({ to: driver.mobile, templateName: "bd_reaccess_link", language: driver.language_preference === "zu" ? "zu" : "en", components: [{ type: "body", parameters: [{ type: "text", text: driver.first_name ?? "Driver" }] }, { type: "button", sub_type: "url", index: 0, parameters: [{ type: "text", text: token }] }] });
    if (!sent) status = "send_failed";
  }
  await supabaseAdmin.from("driver_reaccess_requests").insert({ ...request, driver_id: driver.id, company_id: previous.company_id, delivery_status: status, delivery_error: error?.message ?? null });
  return NextResponse.json(generic);
}
