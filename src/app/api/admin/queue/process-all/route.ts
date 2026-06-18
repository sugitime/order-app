import { LineItemStatus, OrderActivityAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { logOrderActivity } from "@/lib/order-activity-log";
import { processQueueItem } from "@/lib/order-flow";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queuedItems = await prisma.lineItem.findMany({
    where: {
      status: { in: [LineItemStatus.QUEUED, LineItemStatus.FAILED] },
    },
    orderBy: { queuedAt: "asc" },
    select: { id: true, orderId: true, description: true, quantity: true },
  });

  const results = [];
  for (const item of queuedItems) {
    const result = await processQueueItem(item.id);
    if (result.success) {
      await logOrderActivity({
        orderId: item.orderId,
        lineItemId: item.id,
        action: OrderActivityAction.LINE_ITEM_ORDERED,
        performedById: user.id,
        details: `${item.description} — Amazon order ${result.amazonOrderId}`,
      });
    } else {
      await logOrderActivity({
        orderId: item.orderId,
        lineItemId: item.id,
        action: OrderActivityAction.LINE_ITEM_ORDER_FAILED,
        performedById: user.id,
        details: `${item.description} (qty ${item.quantity}) — ${result.error}`,
      });
    }
    results.push({ id: item.id, ...result });
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}