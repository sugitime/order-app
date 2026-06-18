import type { EmailTemplateKey, EmailTemplatesConfig } from "@/types/config";

export type TemplateToken = {
  key: string;
  label: string;
  description: string;
};

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

export const EMAIL_TEMPLATE_META: Record<
  EmailTemplateKey,
  { label: string; description: string; tokens: TemplateToken[] }
> = {
  orderSubmitted: {
    label: "New order submitted",
    description: "Sent to the admin when a requester submits a new order.",
    tokens: [
      { key: "requesterName", label: "Requester name", description: "Name on the order" },
      { key: "requesterEmail", label: "Requester email", description: "Email on the order" },
      { key: "departmentName", label: "Department", description: "Department name" },
      { key: "orderId", label: "Order reference", description: "Order ID" },
      { key: "itemList", label: "Item list", description: "Formatted list of line items" },
      { key: "adminUrl", label: "Admin orders URL", description: "Link to review orders" },
    ],
  },
  orderSubmissionConfirmation: {
    label: "Order submission confirmation",
    description: "Sent to the requester immediately after they submit an order.",
    tokens: [
      { key: "requesterName", label: "Requester name", description: "Name on the order" },
      { key: "requesterEmail", label: "Requester email", description: "Email on the order" },
      { key: "departmentName", label: "Department", description: "Department name" },
      { key: "orderId", label: "Order reference", description: "Order reference number" },
      { key: "itemList", label: "Item list", description: "Formatted list of submitted items" },
    ],
  },
  orderReviewComplete: {
    label: "Order review complete",
    description: "Sent to the requester when every line item has been reviewed.",
    tokens: [
      { key: "requesterName", label: "Requester name", description: "Name on the order" },
      { key: "requesterEmail", label: "Requester email", description: "Email on the order" },
      { key: "departmentName", label: "Department", description: "Department name" },
      { key: "orderId", label: "Order reference", description: "Order ID" },
      { key: "itemList", label: "Item statuses", description: "Each item with approval status" },
    ],
  },
  lineItemApproved: {
    label: "Line item approved",
    description: "Sent to the admin when a line item is approved.",
    tokens: [
      { key: "requesterName", label: "Requester name", description: "Name on the order" },
      { key: "departmentName", label: "Department", description: "Department name" },
      { key: "itemDescription", label: "Item description", description: "Line item description" },
      { key: "status", label: "Status", description: "Review status" },
      { key: "adminUrl", label: "Admin URL", description: "Link to admin" },
    ],
  },
  lineItemDenied: {
    label: "Line item denied",
    description: "Sent to the admin when a line item is denied.",
    tokens: [
      { key: "requesterName", label: "Requester name", description: "Name on the order" },
      { key: "departmentName", label: "Department", description: "Department name" },
      { key: "itemDescription", label: "Item description", description: "Line item description" },
      { key: "status", label: "Status", description: "Review status" },
      { key: "denialReason", label: "Denial reason", description: "Why the item was denied" },
      { key: "adminUrl", label: "Admin URL", description: "Link to admin" },
    ],
  },
  orderPlaced: {
    label: "Item ordered on Amazon",
    description: "Sent to the admin when a queued item is successfully ordered.",
    tokens: [
      { key: "requesterName", label: "Requester name", description: "Name on the order" },
      { key: "departmentName", label: "Department", description: "Department name" },
      { key: "itemDescription", label: "Item description", description: "Line item description" },
      { key: "amazonOrderId", label: "Amazon order ID", description: "Amazon order reference" },
      { key: "trackingNumber", label: "Tracking number", description: "Shipment tracking if available" },
      { key: "adminUrl", label: "Admin URL", description: "Link to admin queue" },
    ],
  },
  passwordReset: {
    label: "Password reset",
    description: "Sent when an admin requests a password reset.",
    tokens: [
      { key: "userName", label: "User name", description: "Admin user's display name" },
      { key: "resetUrl", label: "Reset link", description: "One-time password reset URL" },
    ],
  },
  testEmail: {
    label: "Test email",
    description: "Sent from settings to verify SMTP configuration.",
    tokens: [
      { key: "fromName", label: "From name", description: "Configured sender display name" },
    ],
  },
};

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplatesConfig = {
  orderSubmitted: {
    subject: "New order request from {{requesterName}}",
    bodyHtml:
      "<p>A new order has been submitted.</p>" +
      "<p><strong>Requester:</strong> {{requesterName}}<br>" +
      "<strong>Email:</strong> {{requesterEmail}}<br>" +
      "<strong>Department:</strong> {{departmentName}}<br>" +
      "<strong>Reference:</strong> {{orderId}}</p>" +
      "<p><strong>Items:</strong></p><pre>{{itemList}}</pre>" +
      '<p><a href="{{adminUrl}}">Review in admin</a></p>',
  },
  orderSubmissionConfirmation: {
    subject: "Your order request was received — Reference {{orderId}}",
    bodyHtml:
      "<p>Hi {{requesterName}},</p>" +
      "<p>Thanks for submitting your order request. Please save this reference number:</p>" +
      "<p><strong>{{orderId}}</strong></p>" +
      "<p>You will receive another email when your items have been reviewed.</p>" +
      "<p><strong>Department:</strong> {{departmentName}}</p>" +
      "<p><strong>Items submitted:</strong></p><pre>{{itemList}}</pre>",
  },
  orderReviewComplete: {
    subject: "Your order request has been reviewed",
    bodyHtml:
      "<p>Hi {{requesterName}},</p>" +
      "<p>Your order request has been reviewed. Here is the status of each item:</p>" +
      "<pre>{{itemList}}</pre>" +
      "<p><strong>Reference:</strong> {{orderId}}</p>",
  },
  lineItemApproved: {
    subject: "Line item approved: {{itemDescription}}",
    bodyHtml:
      "<p>A line item was approved.</p>" +
      "<p><strong>Item:</strong> {{itemDescription}}<br>" +
      "<strong>Requester:</strong> {{requesterName}}<br>" +
      "<strong>Department:</strong> {{departmentName}}<br>" +
      "<strong>Status:</strong> {{status}}</p>",
  },
  lineItemDenied: {
    subject: "Line item denied: {{itemDescription}}",
    bodyHtml:
      "<p>A line item was denied.</p>" +
      "<p><strong>Item:</strong> {{itemDescription}}<br>" +
      "<strong>Requester:</strong> {{requesterName}}<br>" +
      "<strong>Department:</strong> {{departmentName}}<br>" +
      "<strong>Status:</strong> {{status}}<br>" +
      "<strong>Reason:</strong> {{denialReason}}</p>",
  },
  orderPlaced: {
    subject: "Order placed: {{itemDescription}}",
    bodyHtml:
      "<p>An item was ordered on Amazon.</p>" +
      "<p><strong>Item:</strong> {{itemDescription}}<br>" +
      "<strong>Requester:</strong> {{requesterName}}<br>" +
      "<strong>Department:</strong> {{departmentName}}<br>" +
      "<strong>Amazon Order ID:</strong> {{amazonOrderId}}<br>" +
      "<strong>Tracking:</strong> {{trackingNumber}}</p>",
  },
  passwordReset: {
    subject: "QM Order System — Reset your password",
    bodyHtml:
      "<p>Hi {{userName}},</p>" +
      "<p>We received a request to reset your password.</p>" +
      '<p><a href="{{resetUrl}}">Reset your password</a></p>' +
      "<p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>",
  },
  testEmail: {
    subject: "QM Order System — Test Email",
    bodyHtml:
      "<p>This is a test email from <strong>{{fromName}}</strong>.</p>" +
      "<p>SMTP configuration is working.</p>",
  },
};

export function mergeEmailTemplates(
  current: EmailTemplatesConfig,
  incoming: Partial<EmailTemplatesConfig>
): EmailTemplatesConfig {
  const merged = { ...current };
  for (const key of Object.keys(DEFAULT_EMAIL_TEMPLATES) as EmailTemplateKey[]) {
    if (incoming[key]) {
      merged[key] = {
        subject: incoming[key]!.subject?.trim() || current[key].subject,
        bodyHtml: incoming[key]!.bodyHtml?.trim() || current[key].bodyHtml,
      };
    }
  }
  return merged;
}

function replaceTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    return tokens[key] ?? "";
  });
}

function htmlToPlainText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/pre>/gi, "\n")
    .replace(/<\/div>/gi, "\n");

  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  const decoded = stripped
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

  return decoded
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderEmailTemplate(
  template: { subject: string; bodyHtml: string },
  tokens: Record<string, string>
): RenderedEmail {
  const subject = replaceTokens(template.subject, tokens);
  const html = replaceTokens(template.bodyHtml, tokens);
  const text = htmlToPlainText(html);

  return { subject, html, text };
}

export function getAdminUrl(path = "/admin/orders"): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}${path}`;
}