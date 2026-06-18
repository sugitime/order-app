import { NextResponse } from "next/server";
import {
  getAppSettings,
  mergeAmazonConfig,
  mergeDisclaimerConfigSettings,
  mergeEmailTemplatesConfig,
  mergeGmailConfig,
  mergeNotificationConfig,
  maskSecret,
  saveAppSettings,
  settingsForClient,
} from "@/lib/config";
import { requireAdmin } from "@/lib/auth";
import {
  amazonConfigSchema,
  disclaimerConfigSchema,
  emailTemplatesSchema,
  gmailConfigSchema,
  notificationConfigSchema,
} from "@/lib/validators";
import { z } from "zod";

const settingsSchema = z.object({
  gmail: gmailConfigSchema.partial().optional(),
  amazon: amazonConfigSchema.partial().optional(),
  notifications: notificationConfigSchema.partial().optional(),
  emailTemplates: emailTemplatesSchema.partial().optional(),
  disclaimer: disclaimerConfigSchema.partial().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getAppSettings();

    return NextResponse.json({
      settings: {
        ...settingsForClient(settings),
        amazon: {
          ...settings.amazon,
          secretAccessKey: maskSecret(settings.amazon.secretAccessKey),
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid settings" },
        { status: 400 }
      );
    }

    const current = await getAppSettings();
    const updated = {
      gmail: parsed.data.gmail
        ? mergeGmailConfig(current.gmail, parsed.data.gmail)
        : current.gmail,
      amazon: parsed.data.amazon
        ? mergeAmazonConfig(current.amazon, parsed.data.amazon)
        : current.amazon,
      notifications: parsed.data.notifications
        ? mergeNotificationConfig(current.notifications, parsed.data.notifications)
        : current.notifications,
      emailTemplates: parsed.data.emailTemplates
        ? mergeEmailTemplatesConfig(current.emailTemplates, parsed.data.emailTemplates)
        : current.emailTemplates,
      disclaimer: parsed.data.disclaimer
        ? mergeDisclaimerConfigSettings(current.disclaimer, parsed.data.disclaimer)
        : current.disclaimer,
    };

    await saveAppSettings(updated);

    return NextResponse.json({
      settings: {
        ...settingsForClient(updated),
        amazon: {
          ...updated.amazon,
          secretAccessKey: maskSecret(updated.amazon.secretAccessKey),
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}