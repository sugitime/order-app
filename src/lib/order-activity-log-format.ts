import type { OrderActivityAction } from "@prisma/client";

export function formatActivityAction(action: OrderActivityAction): string {
  switch (action) {
    case "LINE_ITEM_APPROVED":
      return "approved a line item";
    case "LINE_ITEM_DENIED":
      return "denied a line item";
    case "ORDER_DENIED":
      return "denied the entire order";
    case "ORDER_DELETED":
      return "deleted the order";
    default:
      return action;
  }
}

export function formatActivityMessage(
  action: OrderActivityAction,
  performerName: string,
  details: string | null
): string {
  const base = `${performerName} ${formatActivityAction(action)}`;
  return details ? `${base} — ${details}` : base;
}