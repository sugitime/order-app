import { OrderActivityAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { logOrderActivity } from "@/lib/order-activity-log";
import { manuallyCompleteOrder } from "@/lib/order-flow";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const completeSchema = z.object({
  amazonOrderId: z.string().min(1),
  trackingNumber: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = completeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Amazon order ID is required" }, { status: 400 });
    }

    const existing = await prisma.lineItem.findUnique({
      where: { id },
      select: { id: true, orderId: true, description: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 });
    }

    const item = await manuallyCompleteOrder(
      id,
      parsed.data.amazonOrderId,
      parsed.data.trackingNumber
    );

    await logOrderActivity({
      orderId: existing.orderId,
      lineItemId: existing.id,
      action: OrderActivityAction.LINE_ITEM_MANUAL_COMPLETE,
      performedById: user.id,
      details: `${existing.description} — Amazon order ${parsed.data.amazonOrderId}${
        parsed.data.trackingNumber ? `, tracking ${parsed.data.trackingNumber}` : ""
      }`,
    });

    return NextResponse.json({ lineItem: item });
  } catch (error) {
    console.error("Manual complete error:", error);
    return NextResponse.json({ error: "Failed to complete order" }, { status: 500 });
  }
}