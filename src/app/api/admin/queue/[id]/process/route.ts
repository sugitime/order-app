import { OrderActivityAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { logOrderActivity } from "@/lib/order-activity-log";
import { processQueueItem } from "@/lib/order-flow";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const lineItem = await prisma.lineItem.findUnique({
      where: { id },
      select: { id: true, orderId: true, description: true, quantity: true },
    });

    if (!lineItem) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 });
    }

    const result = await processQueueItem(id);
    if (!result.success) {
      await logOrderActivity({
        orderId: lineItem.orderId,
        lineItemId: lineItem.id,
        action: OrderActivityAction.LINE_ITEM_ORDER_FAILED,
        performedById: user.id,
        details: `${lineItem.description} (qty ${lineItem.quantity}) — ${result.error}`,
      });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logOrderActivity({
      orderId: lineItem.orderId,
      lineItemId: lineItem.id,
      action: OrderActivityAction.LINE_ITEM_ORDERED,
      performedById: user.id,
      details: `${lineItem.description} — Amazon order ${result.amazonOrderId}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Queue process error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process item" },
      { status: 500 }
    );
  }
}