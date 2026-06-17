import nodemailer from "nodemailer";
import { getAppSettings } from "@/lib/config";

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const settings = await getAppSettings();
  const { gmail } = settings;

  if (!gmail.enabled || !gmail.user || !gmail.password || !gmail.fromEmail) {
    console.warn("Email not configured; skipping send:", options.subject);
    return { sent: false, reason: "not_configured" as const };
  }

  const transporter = nodemailer.createTransport({
    host: gmail.host,
    port: gmail.port,
    secure: gmail.secure,
    auth: {
      user: gmail.user,
      pass: gmail.password,
    },
  });

  await transporter.sendMail({
    from: `"${gmail.fromName}" <${gmail.fromEmail}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html ?? options.text.replace(/\n/g, "<br>"),
  });

  return { sent: true as const };
}

export async function notifyAdmins(subject: string, body: string) {
  const settings = await getAppSettings();
  const adminEmail = settings.notifications.adminEmail;
  if (!adminEmail) {
    return { sent: false, reason: "no_admin_email" as const };
  }
  return sendEmail({ to: adminEmail, subject, text: body });
}