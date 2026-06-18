import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAppSettings, mergeGmailConfig } from "@/lib/config";
import { renderEmailTemplate } from "@/lib/email-templates";
import { sendEmailWithConfig } from "@/lib/email";
import { gmailConfigSchema } from "@/lib/validators";
import { z } from "zod";

const testSchema = z.object({
  to: z.string().email(),
  gmail: gmailConfigSchema.partial().optional(),
});

function authErrorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "You must be logged in to send a test email." },
        { status: 401 }
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Only administrators can send test emails." },
        { status: 403 }
      );
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = testSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Valid email required" },
        { status: 400 }
      );
    }

    const saved = await getAppSettings();
    const gmail = parsed.data.gmail
      ? mergeGmailConfig(saved.gmail, parsed.data.gmail)
      : saved.gmail;

    if (!gmail.enabled) {
      return NextResponse.json(
        { error: "Enable email in settings before sending a test email." },
        { status: 400 }
      );
    }

    const provider = gmail.provider ?? "smtp";

    if (!gmail.fromEmail.trim()) {
      return NextResponse.json(
        { error: "From email is required before testing." },
        { status: 400 }
      );
    }

    if (provider === "resend") {
      const apiKey = gmail.apiKey.trim() || process.env.RESEND_API_KEY?.trim() || "";
      if (!apiKey) {
        return NextResponse.json(
          {
            error:
              "Resend API key is required. Save settings or set RESEND_API_KEY on the server.",
          },
          { status: 400 }
        );
      }
    } else if (!gmail.password) {
      return NextResponse.json(
        {
          error:
            "SMTP password is required. Save settings or enter a password before testing.",
        },
        { status: 400 }
      );
    }

    const rendered = renderEmailTemplate(saved.emailTemplates.testEmail, {
      fromName: gmail.fromName.trim() || "QM Order System",
    });

    const result = await sendEmailWithConfig(gmail, {
      to: parsed.data.to,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });

    if (!result.sent) {
      return NextResponse.json(
        { error: "Email not sent. Check email provider settings and enable email." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Test email error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send test email. Check your email provider settings and credentials.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}