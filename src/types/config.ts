export type GmailConfig = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
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

export type AppSettings = {
  gmail: GmailConfig;
  amazon: AmazonConfig;
  notifications: NotificationConfig;
};