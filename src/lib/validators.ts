import { z } from "zod";

const AMAZON_HOST_PATTERN =
  /^https?:\/\/(www\.)?(amazon\.(com|co\.uk|de|fr|ca|co\.jp|in|com\.au|com\.mx|it|es|nl|se|pl|com\.br|ae|sa|sg|com\.tr)|smile\.amazon\.com|a\.co)\//i;

export function isAmazonUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return AMAZON_HOST_PATTERN.test(parsed.href);
  } catch {
    return false;
  }
}

export const amazonUrlSchema = z
  .string()
  .url("Please enter a valid URL")
  .refine(isAmazonUrl, "Only Amazon URLs are accepted");

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  amazonUrl: amazonUrlSchema,
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(999),
  justification: z.string().min(1, "Justification is required").max(1000),
});

export const orderStepOneSchema = z.object({
  requesterName: z.string().min(1, "Name is required").max(200),
  departmentId: z.string().min(1, "Department is required"),
});

export const orderSubmitSchema = z.object({
  requesterName: z.string().min(1).max(200),
  departmentId: z.string().min(1),
  acknowledged: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the disclaimer" }),
  }),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "APPROVER"]),
});

export const gmailConfigSchema = z.object({
  enabled: z.boolean(),
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string(),
  password: z.string(),
  fromEmail: z.string().email().or(z.literal("")),
  fromName: z.string(),
});

export const amazonConfigSchema = z.object({
  enabled: z.boolean(),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  partnerTag: z.string(),
  region: z.string(),
  marketplaceId: z.string(),
});

export const notificationConfigSchema = z.object({
  notifyOnSubmit: z.boolean(),
  notifyOnApprove: z.boolean(),
  notifyOnDeny: z.boolean(),
  notifyOnOrder: z.boolean(),
  adminEmail: z.string().email().or(z.literal("")),
});