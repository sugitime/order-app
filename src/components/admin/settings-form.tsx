"use client";

import { useState } from "react";
import { EmailTemplatesSection } from "@/components/admin/email-template-editor";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEFAULT_DISCLAIMER } from "@/lib/disclaimer";
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

  function updateDisclaimer<K extends keyof AppSettings["disclaimer"]>(
    key: K,
    value: AppSettings["disclaimer"][K]
  ) {
    setSettings((prev) => ({
      ...prev,
      disclaimer: { ...prev.disclaimer, [key]: value },
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
          user: settings.gmail.fromEmail.trim().toLowerCase(),
          ...(gmailPassword ? { password: gmailPassword } : {}),
        },
        amazon: {
          ...amazonWithoutSecret,
          ...(amazonSecret ? { secretAccessKey: amazonSecret } : {}),
        },
        notifications: settings.notifications,
        emailTemplates: settings.emailTemplates,
        disclaimer: settings.disclaimer,
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
      const { password: _gmailPw, ...gmailWithoutPassword } = settings.gmail;

      const response = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail,
          gmail: {
            ...gmailWithoutPassword,
            ...(gmailPassword ? { password: gmailPassword } : {}),
          },
        }),
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
          <h2 className="font-semibold text-text">SMTP email</h2>
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
          Messages are sent from the address below. SMTP authentication uses that same address
          so your personal login is never exposed to recipients.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label>From email</label>
            <input
              type="email"
              value={settings.gmail.fromEmail}
              onChange={(e) => updateGmail("fromEmail", e.target.value)}
              placeholder="noreply@sugiti.me"
            />
          </div>
          <div>
            <label>From name</label>
            <input
              value={settings.gmail.fromName}
              onChange={(e) => updateGmail("fromName", e.target.value)}
              placeholder="QM Order System"
            />
          </div>
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
          <div className="sm:col-span-2">
            <label>SMTP password</label>
            <input
              type="password"
              value={gmailPassword}
              onChange={(e) => setGmailPassword(e.target.value)}
              placeholder="********"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-text-muted">
              Password for the From email account on your mail server.
            </p>
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
          Product Advertising API credentials are also used to fetch item price and Prime
          eligibility when orders are submitted. Full auto-checkout requires Amazon Business
          API access; until configured, the system can simulate orders for testing or you can
          enter order IDs manually in the queue.
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-text">Order disclaimer</h2>
            <p className="mt-1 text-sm text-text-muted">
              Content shown on step 2 of the public order form before requesters add line items.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setSettings((prev) => ({ ...prev, disclaimer: { ...DEFAULT_DISCLAIMER } }))
            }
            className="shrink-0 text-xs text-text-muted transition hover:text-brand-400"
          >
            Reset to default
          </button>
        </div>

        <div>
          <label htmlFor="disclaimer-title">Page title</label>
          <input
            id="disclaimer-title"
            value={settings.disclaimer.title}
            onChange={(e) => updateDisclaimer("title", e.target.value)}
            placeholder="Before you order"
          />
        </div>

        <div>
          <label>Disclaimer text</label>
          <RichTextEditor
            value={settings.disclaimer.bodyHtml}
            onChange={(bodyHtml) => updateDisclaimer("bodyHtml", bodyHtml)}
            placeholder="Write the disclaimer shown to requesters..."
            minHeight="140px"
          />
          <div
            className="mt-3 rounded-lg border border-amber-700/50 bg-amber-950/40 p-4 text-sm leading-relaxed text-amber-200 [&_a]:text-amber-100 [&_a]:underline [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p+_p]:mt-4 [&_ul]:list-disc [&_ul]:pl-4"
            dangerouslySetInnerHTML={{ __html: settings.disclaimer.bodyHtml }}
          />
          <p className="mt-1 text-xs text-text-muted">Preview of how the disclaimer appears to requesters.</p>
        </div>

        <div>
          <label htmlFor="disclaimer-ack">Acknowledgment checkbox text</label>
          <textarea
            id="disclaimer-ack"
            rows={3}
            value={settings.disclaimer.acknowledgmentText}
            onChange={(e) => updateDisclaimer("acknowledgmentText", e.target.value)}
            placeholder="I acknowledge that..."
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold text-text">Email templates</h2>
          <p className="mt-1 text-sm text-text-muted">
            Customize the subject and body for each automated email. Use tokens like{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs text-brand-400">
              {"{{requesterName}}"}
            </code>{" "}
            to insert dynamic values.
          </p>
        </div>
        <EmailTemplatesSection
          templates={settings.emailTemplates}
          onChange={(emailTemplates) => setSettings((prev) => ({ ...prev, emailTemplates }))}
        />
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