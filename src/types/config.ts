export type EmailProvider = "smtp" | "resend";

export type GmailConfig = {
  provider: EmailProvider;
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  apiKey: string;
  fromEmail: string;
  fromName: string;
};

export type AmazonConfig = {
  enabled: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  partnerTag: string;
  region: string;
  marketplaceId: string;
};

export type NotificationConfig = {
  notifyOnSubmit: boolean;
  notifyOnApprove: boolean;
  notifyOnDeny: boolean;
  notifyOnOrder: boolean;
  adminEmail: string;
};

export type EmailTemplateKey =
  | "orderSubmitted"
  | "orderSubmissionConfirmation"
  | "orderReviewComplete"
  | "lineItemApproved"
  | "lineItemDenied"
  | "orderPlaced"
  | "passwordReset"
  | "testEmail";

export type EmailTemplate = {
  subject: string;
  bodyHtml: string;
};

export type EmailTemplatesConfig = Record<EmailTemplateKey, EmailTemplate>;

export type DisclaimerConfig = {
  title: string;
  bodyHtml: string;
  acknowledgmentText: string;
};

export type AppSettings = {
  gmail: GmailConfig;
  amazon: AmazonConfig;
  notifications: NotificationConfig;
  emailTemplates: EmailTemplatesConfig;
  disclaimer: DisclaimerConfig;
};