import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, getConfigs } from "@/lib/supabase";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      organisation,
      email,
      phone,
      role,
      subject,
      message,
      source = "tag_contact",
    } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save to database
    const { data: enquiry, error } = await supabaseAdmin
      .from("enquiries")
      .insert({
        source,
        name,
        company: organisation ?? "",
        email,
        phone: phone ?? "",
        message,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Send email notification
    const config = await getConfigs(["email_enquiry_to", "email_from_name"]);
    const notifyEmail = config.email_enquiry_to || "abdool@transportactiongroup.com";
    const fromName = config.email_from_name || "Transport Action Group";

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: `${fromName} <notifications@transportactiongroup.com>`,
        to: notifyEmail,
        subject: `New ${source === "tag_partnership" ? "partnership" : "contact"} enquiry from ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #111827;">New Enquiry — ${source === "tag_partnership" ? "Partnership" : "Contact"}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Name</td><td style="padding: 8px 0; color: #111827; font-weight: 600;">${name}</td></tr>
              ${organisation ? `<tr><td style="padding: 8px 0; color: #6b7280;">Organisation</td><td style="padding: 8px 0; color: #111827;">${organisation}</td></tr>` : ""}
              ${role ? `<tr><td style="padding: 8px 0; color: #6b7280;">Role</td><td style="padding: 8px 0; color: #111827;">${role}</td></tr>` : ""}
              <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #22c55e;">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding: 8px 0; color: #6b7280;">Phone</td><td style="padding: 8px 0; color: #111827;">${phone}</td></tr>` : ""}
              ${subject ? `<tr><td style="padding: 8px 0; color: #6b7280;">Subject</td><td style="padding: 8px 0; color: #111827;">${subject}</td></tr>` : ""}
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">Message</p>
              <p style="color: #111827; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">
              Submitted ${new Date().toLocaleString("en-ZA")} · View in <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/enquiries" style="color: #22c55e;">Admin Inbox</a>
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true, id: enquiry.id });
  } catch (err) {
    console.error("Submit enquiry error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
