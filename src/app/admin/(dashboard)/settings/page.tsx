export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAppSettings, maskSecret, settingsForClient } from "@/lib/config";
import { getSessionUser } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/orders");
  }

  const settings = await getAppSettings();

  const maskedSettings = {
    ...settingsForClient(settings),
    amazon: {
      ...settings.amazon,
      secretAccessKey: maskSecret(settings.amazon.secretAccessKey),
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Configure SMTP, order disclaimer, email templates, notifications, and Amazon API credentials.
        </p>
      </div>
      <SettingsForm initialSettings={maskedSettings} />
    </div>
  );
}