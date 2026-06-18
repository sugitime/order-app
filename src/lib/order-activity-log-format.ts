import type { OrderActivityAction } from "@prisma/client";

export function formatActivityAction(action: OrderActivityAction): string {
  switch (action) {
    case "ORDER_SUBMITTED":
      return "submitted the order";
    case "LINE_ITEM_APPROVED":
      return "approved a line item";
    case "LINE_ITEM_DENIED":
      return "denied a line item";
    case "LINE_ITEM_QUEUED":
      return "queued a line item for ordering";
    case "LINE_ITEM_ORDERED":
      return "placed a line item order";
    case "LINE_ITEM_ORDER_FAILED":
      return "failed to order a line item";
    case "LINE_ITEM_MANUAL_COMPLETE":
      return "manually completed a line item order";
    case "ORDER_DENIED":
      return "denied the entire order";
    case "ORDER_DELETED":
      return "deleted the order";
    default:
      return action;
  }
}

export function formatActivityPerformer(performerName: string | null | undefined): string {
  return performerName?.trim() || "System";
}

export function formatActivityMessage(
  action: OrderActivityAction,
  performerName: string | null | undefined,
  details: string | null
): string {
  const base = `${formatActivityPerformer(performerName)} ${formatActivityAction(action)}`;
  return details ? `${base} — ${details}` : base;
}

export function formatActivityActionLabel(action: OrderActivityAction): string {
  switch (action) {
    case "ORDER_SUBMITTED":
      return "Submitted";
    case "LINE_ITEM_APPROVED":
      return "Approved";
    case "LINE_ITEM_DENIED":
      return "Denied";
    case "LINE_ITEM_QUEUED":
      return "Queued";
    case "LINE_ITEM_ORDERED":
      return "Ordered";
    case "LINE_ITEM_ORDER_FAILED":
      return "Order failed";
    case "LINE_ITEM_MANUAL_COMPLETE":
      return "Manual complete";
    case "ORDER_DENIED":
      return "Order denied";
    case "ORDER_DELETED":
      return "Deleted";
    default:
      return action;
  }
}