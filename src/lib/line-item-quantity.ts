import { LineItemStatus } from "@prisma/client";

export const EDITABLE_LINE_ITEM_QUANTITY_STATUSES: LineItemStatus[] = [
  LineItemStatus.PENDING,
  LineItemStatus.APPROVED,
  LineItemStatus.QUEUED,
  LineItemStatus.FAILED,
];

export function canEditLineItemQuantity(status: LineItemStatus): boolean {
  return EDITABLE_LINE_ITEM_QUANTITY_STATUSES.includes(status);
}