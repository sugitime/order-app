import { LineItemStatus, OrderActivityAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { logOrderActivity } from "@/lib/order-activity-log";
import {
  maybeSendOrderReviewSummary,
  queueApprovedItems,
  sendReviewNotification,
} from "@/lib/order-flow";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["approve", "deny"]),
  denialReason: z.string().optional(),
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
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const item = await prisma.lineItem.findUnique({
      where: { id },
      include: { order: { select: { deletedAt: true } } },
    });
    if (!item) {
      return NextResponse.json({ error: "Line item not found" }, { status: 404 });
    }

    if (item.order.deletedAt) {
      return NextResponse.json({ error: "Order has been deleted" }, { status: 400 });
    }

    if (item.status !== LineItemStatus.PENDING) {
      return NextResponse.json({ error: "Item already reviewed" }, { status: 400 });
    }

    if (parsed.data.action === "deny" && !parsed.data.denialReason?.trim()) {
      return NextResponse.json({ error: "Denial reason is required" }, { status: 400 });
    }

    const updated = await prisma.lineItem.update({
      where: { id },
      data: {
        status:
          parsed.data.action === "approve"
            ? LineItemStatus.APPROVED
            : LineItemStatus.DENIED,
        denialReason:
          parsed.data.action === "deny" ? parsed.data.denialReason?.trim() : null,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    });

    const denialReason =
      parsed.data.action === "deny" ? parsed.data.denialReason?.trim() : undefined;

    await logOrderActivity({
      orderId: updated.orderId,
      lineItemId: id,
      action:
        parsed.data.action === "approve"
          ? OrderActivityAction.LINE_ITEM_APPROVED
          : OrderActivityAction.LINE_ITEM_DENIED,
      performedById: user.id,
      details:
        parsed.data.action === "approve"
          ? `${item.description} (qty ${item.quantity})`
          : `${item.description} (qty ${item.quantity})${denialReason ? ` — ${denialReason}` : ""}`,
    });

    if (parsed.data.action === "approve") {
      await queueApprovedItems([id]);
      await logOrderActivity({
        orderId: updated.orderId,
        lineItemId: id,
        action: OrderActivityAction.LINE_ITEM_QUEUED,
        performedById: user.id,
        details: `${item.description} (qty ${item.quantity})`,
      });
    }

    await sendReviewNotification(id, parsed.data.action === "approve" ? "approved" : "denied");
    await maybeSendOrderReviewSummary(updated.orderId);

    return NextResponse.json({ lineItem: updated });
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json({ error: "Failed to review item" }, { status: 500 });
  }
}