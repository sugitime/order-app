import { NextResponse } from "next/server";
import {
  getAppSettings,
  mergeAmazonConfig,
  mergeGmailConfig,
  mergeNotificationConfig,
  maskSecret,
  saveAppSettings,
} from "@/lib/config";
import { requireAdmin } from "@/lib/auth";
import {
  amazonConfigSchema,
  gmailConfigSchema,
  notificationConfigSchema,
} from "@/lib/validators";
import { z } from "zod";

const settingsSchema = z.object({
  gmail: gmailConfigSchema.partial().optional(),
  amazon: amazonConfigSchema.partial().optional(),
  notifications: notificationConfigSchema.partial().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getAppSettings();

    return NextResponse.json({
      settings: {
        gmail: {
          ...settings.gmail,
          password: maskSecret(settings.gmail.password),
        },
        amazon: {
          ...settings.amazon,
          secretAccessKey: maskSecret(settings.amazon.secretAccessKey),
        },
        notifications: settings.notifications,
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
    };

    await saveAppSettings(updated);

    return NextResponse.json({
      settings: {
        gmail: { ...updated.gmail, password: maskSecret(updated.gmail.password) },
        amazon: {
          ...updated.amazon,
          secretAccessKey: maskSecret(updated.amazon.secretAccessKey),
        },
        notifications: updated.notifications,
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