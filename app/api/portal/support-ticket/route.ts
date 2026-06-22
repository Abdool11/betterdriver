import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin, getConfig } from "@/lib/supabase";

/**
 * POST /api/portal/support-ticket
 * Body: { category: string, message: string }
 * Creates a support ticket and sends an email notification.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { category?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { category, message } = body;
  if (!category || !message || typeof message !== "string" || message.trim().length < 5) {
    return NextResponse.json(
      { error: "Category and message (min 5 chars) are required" },
      { status: 400 }
    );
  }

  // Insert support ticket
  const { data: ticket, error } = await supabaseAdmin
    .from("support_tickets")
    .insert({
      driver_id: session.driverId,
      category,
      message: message.trim(),
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[SUPPORT_TICKET] Insert failed:", error.message);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }

  // Try to send email notification (graceful fallback if Resend is not configured)
  const supportEmail = await getConfig("bd_support_email");
  if (supportEmail) {
    try {
      const { default: Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY ?? "");
      await resend.emails.send({
        from: "BetterDriver Support <support@betterdriver.co.za>",
        to: supportEmail,
        subject: `New support ticket: ${category}`,
        html: `<p><strong>Driver:</strong> ${session.firstName} ${session.lastName} (${session.email})</p>
               <p><strong>Category:</strong> ${category}</p>
               <p><strong>Message:</strong></p>
               <p>${message.trim().replace(/\n/g, "<br/>")}</p>`,
      });
    } catch (emailErr) {
      console.warn("[SUPPORT_TICKET] Email send failed:", emailErr);
    }
  }

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
