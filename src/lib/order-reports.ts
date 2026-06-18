import { LineItemStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { orderAwaitingDecision } from "@/lib/order-status";

const APPROVED_PIPELINE: LineItemStatus[] = [
  LineItemStatus.APPROVED,
  LineItemStatus.QUEUED,
  LineItemStatus.ORDERING,
  LineItemStatus.ORDERED,
];

function lineItemTotal(
  unitPrice: { toString(): string } | null,
  quantity: number
): number {
  if (unitPrice == null) return 0;
  return Number(unitPrice) * quantity;
}

export type OrderReportStats = {
  pendingOrders: number;
  approvedOrders: number;
  itemsPending: number;
  itemsApproved: number;
  itemsDenied: number;
  totalOrderCost: number;
  totalDeniedAmount: number;
};

export async function getOrderReportStats(): Promise<OrderReportStats> {
  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    include: { lineItems: true },
  });

  let pendingOrders = 0;
  let approvedOrders = 0;
  let itemsPending = 0;
  let itemsApproved = 0;
  let itemsDenied = 0;
  let totalOrderCost = 0;
  let totalDeniedAmount = 0;

  for (const order of orders) {
    if (orderAwaitingDecision(order.lineItems)) {
      pendingOrders++;
    }

    const allApproved =
      order.lineItems.length > 0 &&
      order.lineItems.every((item) => item.status === LineItemStatus.APPROVED);

    if (allApproved) {
      approvedOrders++;
    }

    for (const item of order.lineItems) {
      const amount = lineItemTotal(item.unitPrice, item.quantity);

      switch (item.status) {
        case LineItemStatus.PENDING:
          itemsPending++;
          break;
        case LineItemStatus.DENIED:
          itemsDenied++;
          totalDeniedAmount += amount;
          break;
        case LineItemStatus.APPROVED:
          itemsApproved++;
          totalOrderCost += amount;
          break;
        default:
          if (APPROVED_PIPELINE.includes(item.status)) {
            itemsApproved++;
            totalOrderCost += amount;
          }
          break;
      }
    }
  }

  return {
    pendingOrders,
    approvedOrders,
    itemsPending,
    itemsApproved,
    itemsDenied,
    totalOrderCost,
    totalDeniedAmount,
  };
}