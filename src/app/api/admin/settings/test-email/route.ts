import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const testSchema = z.object({
  to: z.string().email(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = testSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const result = await sendEmail({
      to: parsed.data.to,
      subject: "QM Order System — Test Email",
      text: "This is a test email from the QM Order System. Gmail configuration is working.",
    });

    if (!result.sent) {
      return NextResponse.json(
        { error: "Email not sent. Check Gmail settings and enable email." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}