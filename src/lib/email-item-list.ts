import type { LineItemStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/amazon-product";

type SubmittedItem = {
  description: string;
  quantity: number;
  amazonUrl: string;
  unitPrice: { toString(): string } | null;
  priceCurrency: string | null;
  isPrimeEligible: boolean | null;
};

type ReviewedItem = SubmittedItem & {
  status: LineItemStatus;
  denialReason: string | null;
};

function lineTotalLabel(item: SubmittedItem): string {
  const price =
    item.unitPrice != null
      ? formatCurrency(Number(item.unitPrice), item.priceCurrency ?? "USD")
      : null;
  const prime =
    item.isPrimeEligible === null
      ? null
      : item.isPrimeEligible
        ? "Prime"
        : "Not Prime";

  const parts = [`Qty ${item.quantity}`];
  if (price) parts.push(`${price} each`);
  if (prime) parts.push(prime);
  return parts.join(" · ");
}

function reviewStatusLabel(status: LineItemStatus): "Approved" | "Denied" | "Pending" {
  if (status === "DENIED") return "Denied";
  if (status === "PENDING") return "Pending";
  return "Approved";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemListStyles(): string {
  return [
    "margin:0",
    "padding:0",
    "list-style:none",
    "font-family:ui-sans-serif,system-ui,sans-serif",
    "font-size:14px",
    "line-height:1.5",
    "color:#1f2937",
  ].join(";");
}

function itemRowStyles(): string {
  return [
    "margin:0 0 12px 0",
    "padding:12px 14px",
    "border:1px solid #e5e7eb",
    "border-radius:8px",
    "background:#f9fafb",
  ].join(";");
}

export function formatSubmittedItemListHtml(lineItems: SubmittedItem[]): string {
  if (lineItems.length === 0) {
    return '<p style="margin:0;color:#6b7280;">No items.</p>';
  }

  const rows = lineItems
    .map((item, index) => {
      const description = escapeHtml(item.description);
      const meta = escapeHtml(lineTotalLabel(item));
      const url = escapeHtml(item.amazonUrl);

      return (
        `<li style="${itemRowStyles()}">` +
        `<div style="font-weight:600;color:#111827;">Item ${index + 1}: ${description}</div>` +
        `<div style="margin-top:4px;color:#4b5563;">${meta}</div>` +
        `<div style="margin-top:6px;">` +
        `<a href="${url}" style="color:#2563eb;text-decoration:underline;">View on Amazon</a>` +
        `</div>` +
        `</li>`
      );
    })
    .join("");

  return `<ul style="${itemListStyles()}">${rows}</ul>`;
}

export function formatSubmittedItemListText(lineItems: SubmittedItem[]): string {
  return lineItems
    .map((item, index) => {
      return (
        `${index + 1}. ${item.description}\n` +
        `   ${lineTotalLabel(item)}\n` +
        `   ${item.amazonUrl}`
      );
    })
    .join("\n\n");
}

export function formatReviewedItemListHtml(lineItems: ReviewedItem[]): string {
  if (lineItems.length === 0) {
    return '<p style="margin:0;color:#6b7280;">No items.</p>';
  }

  const rows = lineItems
    .map((item) => {
      const status = reviewStatusLabel(item.status);
      const statusColor = status === "Denied" ? "#b91c1c" : status === "Approved" ? "#047857" : "#b45309";
      const description = escapeHtml(item.description);
      const meta = escapeHtml(lineTotalLabel(item));
      const reason =
        item.status === "DENIED" && item.denialReason
          ? `<div style="margin-top:6px;color:#b91c1c;">Reason: ${escapeHtml(item.denialReason)}</div>`
          : "";

      return (
        `<li style="${itemRowStyles()}">` +
        `<div style="font-weight:700;color:${statusColor};">${status}: ${description}</div>` +
        `<div style="margin-top:4px;color:#4b5563;">${meta}</div>` +
        reason +
        `</li>`
      );
    })
    .join("");

  return `<ul style="${itemListStyles()}">${rows}</ul>`;
}

export function formatReviewedItemListText(lineItems: ReviewedItem[]): string {
  return lineItems
    .map((item) => {
      const status = reviewStatusLabel(item.status);
      const reason =
        item.status === "DENIED" && item.denialReason ? `\n   Reason: ${item.denialReason}` : "";
      return `${status}: ${item.description}\n   ${lineTotalLabel(item)}${reason}`;
    })
    .join("\n\n");
}