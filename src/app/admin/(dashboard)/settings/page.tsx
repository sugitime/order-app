export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAppSettings, maskSecret } from "@/lib/config";
import { getSessionUser } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/orders");
  }

  const settings = await getAppSettings();

  const maskedSettings = {
    gmail: {
      ...settings.gmail,
      password: maskSecret(settings.gmail.password),
    },
    amazon: {
      ...settings.amazon,
      secretAccessKey: maskSecret(settings.amazon.secretAccessKey),
    },
    notifications: settings.notifications,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure Gmail for notifications and Amazon API credentials for auto-ordering.
        </p>
      </div>
      <SettingsForm initialSettings={maskedSettings} />
    </div>
  );
}