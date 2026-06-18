import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { getAppSettings } from "@/lib/config";
import type { GmailConfig } from "@/types/config";

function buildFromAddress(gmail: GmailConfig): Mail.Address {
  return {
    name: gmail.fromName.trim() || "QM Order System",
    address: gmail.fromEmail.trim(),
  };
}

function resolveApiKey(gmail: GmailConfig): string {
  return gmail.apiKey.trim() || process.env.RESEND_API_KEY?.trim() || "";
}

async function sendViaResend(
  gmail: GmailConfig,
  options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }
) {
  const apiKey = resolveApiKey(gmail);
  const fromAddress = gmail.fromEmail.trim().toLowerCase();
  const fromName = gmail.fromName.trim() || "QM Order System";

  if (!apiKey) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddress}>`,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html ?? options.text.replace(/\n/g, "<br>"),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Resend API error (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return { sent: true as const };
}

async function sendViaSmtp(
  gmail: GmailConfig,
  options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }
) {
  const fromAddress = gmail.fromEmail.trim().toLowerCase();
  const from = buildFromAddress({ ...gmail, fromEmail: fromAddress });

  const transporter = nodemailer.createTransport({
    host: gmail.host,
    port: gmail.port,
    secure: gmail.secure,
    auth: {
      user: fromAddress,
      pass: gmail.password,
    },
  });

  await transporter.sendMail({
    from,
    envelope: {
      from: fromAddress,
      to: options.to,
    },
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html ?? options.text.replace(/\n/g, "<br>"),
  });

  return { sent: true as const };
}

export async function sendEmailWithConfig(
  gmail: GmailConfig,
  options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }
) {
  const fromAddress = gmail.fromEmail.trim().toLowerCase();

  if (!gmail.enabled || !fromAddress) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const provider = gmail.provider ?? "smtp";

  if (provider === "resend") {
    if (!resolveApiKey(gmail)) {
      return { sent: false as const, reason: "not_configured" as const };
    }
    return sendViaResend(gmail, options);
  }

  if (!gmail.password) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  return sendViaSmtp(gmail, options);
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const settings = await getAppSettings();

  if (!settings.gmail.enabled || !settings.gmail.fromEmail.trim()) {
    console.warn("Email not configured; skipping send:", options.subject);
    return { sent: false, reason: "not_configured" as const };
  }

  const provider = settings.gmail.provider ?? "smtp";
  const hasCredentials =
    provider === "resend"
      ? Boolean(resolveApiKey(settings.gmail))
      : Boolean(settings.gmail.password);

  if (!hasCredentials) {
    console.warn("Email not configured; skipping send:", options.subject);
    return { sent: false, reason: "not_configured" as const };
  }

  return sendEmailWithConfig(settings.gmail, options);
}

export async function notifyAdmins(options: {
  subject: string;
  text: string;
  html?: string;
}) {
  const settings = await getAppSettings();
  const adminEmail = settings.notifications.adminEmail;
  if (!adminEmail) {
    return { sent: false, reason: "no_admin_email" as const };
  }
  return sendEmail({
    to: adminEmail,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}