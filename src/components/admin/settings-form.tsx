"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AppSettings } from "@/types/config";

type MaskedSettings = AppSettings;

export function SettingsForm({ initialSettings }: { initialSettings: MaskedSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [gmailPassword, setGmailPassword] = useState("");
  const [amazonSecret, setAmazonSecret] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateGmail<K extends keyof AppSettings["gmail"]>(
    key: K,
    value: AppSettings["gmail"][K]
  ) {
    setSettings((prev) => ({
      ...prev,
      gmail: { ...prev.gmail, [key]: value },
    }));
  }

  function updateAmazon<K extends keyof AppSettings["amazon"]>(
    key: K,
    value: AppSettings["amazon"][K]
  ) {
    setSettings((prev) => ({
      ...prev,
      amazon: { ...prev.amazon, [key]: value },
    }));
  }

  function updateNotifications<K extends keyof AppSettings["notifications"]>(
    key: K,
    value: AppSettings["notifications"][K]
  ) {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { password: _gmailPw, ...gmailWithoutPassword } = settings.gmail;
      const { secretAccessKey: _amazonSecret, ...amazonWithoutSecret } = settings.amazon;

      const payload = {
        gmail: {
          ...gmailWithoutPassword,
          ...(gmailPassword ? { password: gmailPassword } : {}),
        },
        amazon: {
          ...amazonWithoutSecret,
          ...(amazonSecret ? { secretAccessKey: amazonSecret } : {}),
        },
        notifications: settings.notifications,
      };

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to save settings");
        return;
      }

      setSettings(data.settings);
      setGmailPassword("");
      setAmazonSecret("");
      setMessage("Settings saved.");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function sendTestEmail() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Test email failed");
        return;
      }

      setMessage("Test email sent.");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={saveSettings} className="space-y-6">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text">Gmail</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.gmail.enabled}
              onChange={(e) => updateGmail("enabled", e.target.checked)}
            />
            Enabled
          </label>
        </div>
        <p className="text-sm text-text-muted">
          Use a Gmail App Password (Google Account → Security → 2-Step Verification → App
          passwords).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label>SMTP host</label>
            <input
              value={settings.gmail.host}
              onChange={(e) => updateGmail("host", e.target.value)}
            />
          </div>
          <div>
            <label>SMTP port</label>
            <input
              type="number"
              value={settings.gmail.port}
              onChange={(e) => updateGmail("port", parseInt(e.target.value, 10) || 587)}
            />
          </div>
          <div>
            <label>Gmail address</label>
            <input
              value={settings.gmail.user}
              onChange={(e) => updateGmail("user", e.target.value)}
            />
          </div>
          <div>
            <label>App password</label>
            <input
              type="password"
              value={gmailPassword}
              onChange={(e) => setGmailPassword(e.target.value)}
              placeholder={settings.gmail.password || "Enter app password"}
            />
          </div>
          <div>
            <label>From email</label>
            <input
              value={settings.gmail.fromEmail}
              onChange={(e) => updateGmail("fromEmail", e.target.value)}
            />
          </div>
          <div>
            <label>From name</label>
            <input
              value={settings.gmail.fromName}
              onChange={(e) => updateGmail("fromName", e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.gmail.secure}
            onChange={(e) => updateGmail("secure", e.target.checked)}
          />
          Use TLS/SSL (port 465)
        </label>

        <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <div className="min-w-[240px] flex-1">
            <label>Send test email to</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="button" variant="secondary" onClick={sendTestEmail} disabled={loading}>
            Send test
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text">Amazon auto-ordering</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.amazon.enabled}
              onChange={(e) => updateAmazon("enabled", e.target.checked)}
            />
            Enabled
          </label>
        </div>
        <p className="text-sm text-text-muted">
          Full auto-checkout requires Amazon Business API access. Until configured, the
          system can simulate orders for testing or you can enter order IDs manually in the
          queue.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label>Access key ID</label>
            <input
              value={settings.amazon.accessKeyId}
              onChange={(e) => updateAmazon("accessKeyId", e.target.value)}
            />
          </div>
          <div>
            <label>Secret access key</label>
            <input
              type="password"
              value={amazonSecret}
              onChange={(e) => setAmazonSecret(e.target.value)}
              placeholder={settings.amazon.secretAccessKey || "Enter secret key"}
            />
          </div>
          <div>
            <label>Partner tag / associate tag</label>
            <input
              value={settings.amazon.partnerTag}
              onChange={(e) => updateAmazon("partnerTag", e.target.value)}
            />
          </div>
          <div>
            <label>Marketplace ID</label>
            <input
              value={settings.amazon.marketplaceId}
              onChange={(e) => updateAmazon("marketplaceId", e.target.value)}
            />
          </div>
          <div>
            <label>Region</label>
            <input
              value={settings.amazon.region}
              onChange={(e) => updateAmazon("region", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold text-text">Notifications</h2>
        <div>
          <label>Admin notification email</label>
          <input
            type="email"
            value={settings.notifications.adminEmail}
            onChange={(e) => updateNotifications("adminEmail", e.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["notifyOnSubmit", "New order submitted"],
              ["notifyOnApprove", "Line item approved"],
              ["notifyOnDeny", "Line item denied"],
              ["notifyOnOrder", "Item ordered on Amazon"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.notifications[key]}
                onChange={(e) => updateNotifications(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-green-400">{message}</p>}

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}