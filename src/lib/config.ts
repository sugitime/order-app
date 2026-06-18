import { DEFAULT_DISCLAIMER, mergeDisclaimerConfig } from "@/lib/disclaimer";
import { DEFAULT_EMAIL_TEMPLATES, mergeEmailTemplates } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import type {
  AmazonConfig,
  AppSettings,
  DisclaimerConfig,
  EmailProvider,
  EmailTemplatesConfig,
  GmailConfig,
  NotificationConfig,
} from "@/types/config";

function parseEnvBool(value: string | undefined): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  return value === "true" || value === "1";
}

export function applyEmailEnvOverrides(gmail: GmailConfig): GmailConfig {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const password =
    process.env.SMTP_PASSWORD?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.SMTP_FROM_EMAIL?.trim() || process.env.GMAIL_FROM_EMAIL?.trim();
  const fromName = process.env.SMTP_FROM_NAME?.trim();
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT?.trim();
  const secure = process.env.SMTP_SECURE?.trim();
  const enabled = process.env.EMAIL_ENABLED?.trim();

  return {
    ...gmail,
    ...(provider === "smtp" || provider === "resend"
      ? { provider: provider as EmailProvider }
      : {}),
    ...(enabled !== undefined ? { enabled: parseEnvBool(enabled) ?? gmail.enabled } : {}),
    ...(host ? { host } : {}),
    ...(port ? { port: parseInt(port, 10) || gmail.port } : {}),
    ...(secure !== undefined ? { secure: parseEnvBool(secure) ?? gmail.secure } : {}),
    ...(password ? { password } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(fromEmail
      ? { fromEmail: fromEmail.toLowerCase(), user: fromEmail.toLowerCase() }
      : {}),
    ...(fromName ? { fromName } : {}),
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  gmail: {
    provider: "smtp",
    enabled: false,
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: "",
    password: "",
    apiKey: "",
    fromEmail: "",
    fromName: "QM Order System",
  },
  amazon: {
    enabled: false,
    accessKeyId: "",
    secretAccessKey: "",
    partnerTag: "",
    region: "us-east-1",
    marketplaceId: "ATVPDKIKX0DER",
  },
  notifications: {
    notifyOnSubmit: true,
    notifyOnApprove: true,
    notifyOnDeny: true,
    notifyOnOrder: true,
    adminEmail: "",
  },
  emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  disclaimer: DEFAULT_DISCLAIMER,
};

export async function getAppSettings(): Promise<AppSettings> {
  const record = await prisma.appConfig.findUnique({ where: { id: "singleton" } });
  if (!record?.value) {
    return DEFAULT_SETTINGS;
  }

  const stored = record.value as Partial<AppSettings>;
  return {
    gmail: applyEmailEnvOverrides({ ...DEFAULT_SETTINGS.gmail, ...stored.gmail }),
    amazon: { ...DEFAULT_SETTINGS.amazon, ...stored.amazon },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications },
    emailTemplates: mergeEmailTemplates(
      DEFAULT_SETTINGS.emailTemplates,
      stored.emailTemplates ?? {}
    ),
    disclaimer: mergeDisclaimerConfig(
      DEFAULT_SETTINGS.disclaimer,
      stored.disclaimer ?? {}
    ),
  };
}

export async function saveAppSettings(settings: AppSettings) {
  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: { value: settings },
    create: { id: "singleton", value: settings },
  });
}

export function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.min(value.length - 4, 12))}${value.slice(-4)}`;
}

export function settingsForClient(settings: AppSettings): AppSettings {
  const { password: _password, apiKey: _apiKey, ...gmailWithoutSecrets } = settings.gmail;
  return {
    ...settings,
    gmail: { ...gmailWithoutSecrets, password: "", apiKey: "" },
  };
}

export function mergeGmailConfig(
  current: GmailConfig,
  incoming: Partial<GmailConfig>
): GmailConfig {
  return {
    ...current,
    ...incoming,
    provider: incoming.provider ?? current.provider ?? "smtp",
    password: incoming.password?.trim() ? incoming.password : current.password,
    apiKey: incoming.apiKey?.trim() ? incoming.apiKey : current.apiKey,
  };
}

export function mergeAmazonConfig(
  current: AmazonConfig,
  incoming: Partial<AmazonConfig>
): AmazonConfig {
  return {
    ...current,
    ...incoming,
    secretAccessKey: incoming.secretAccessKey?.trim()
      ? incoming.secretAccessKey
      : current.secretAccessKey,
  };
}

export function mergeNotificationConfig(
  current: NotificationConfig,
  incoming: Partial<NotificationConfig>
): NotificationConfig {
  return { ...current, ...incoming };
}

export function mergeEmailTemplatesConfig(
  current: EmailTemplatesConfig,
  incoming: Partial<EmailTemplatesConfig>
): EmailTemplatesConfig {
  return mergeEmailTemplates(current, incoming);
}

export function mergeDisclaimerConfigSettings(
  current: DisclaimerConfig,
  incoming: Partial<DisclaimerConfig>
): DisclaimerConfig {
  return mergeDisclaimerConfig(current, incoming);
}