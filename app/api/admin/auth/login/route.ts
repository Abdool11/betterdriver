import { NextRequest, NextResponse } from "next/server";
import { verifyBDAdminCredentials, createAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const session = await verifyBDAdminCredentials(email, password);
    if (!session) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createAdminSession(session);

    return NextResponse.json({
      ok: true,
      admin: { name: session.name, email: session.email, role: session.role },
    });
  } catch (err) {
    console.error("BD admin login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
