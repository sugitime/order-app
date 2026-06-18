import { LineItemStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { maybeSendOrderReviewSummary, sendReviewNotification } from "@/lib/order-flow";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const denyOrderSchema = z.object({
  denialReason: z.string().min(1, "Denial reason is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;

  try {
    const body = await request.json();
    const parsed = denyOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { lineItems: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const pendingItems = order.lineItems.filter(
      (item) => item.status === LineItemStatus.PENDING
    );

    if (pendingItems.length === 0) {
      return NextResponse.json(
        { error: "No pending items to deny on this order" },
        { status: 400 }
      );
    }

    const reason = parsed.data.denialReason.trim();
    const now = new Date();

    await prisma.lineItem.updateMany({
      where: {
        orderId,
        status: LineItemStatus.PENDING,
      },
      data: {
        status: LineItemStatus.DENIED,
        denialReason: reason,
        reviewedById: user.id,
        reviewedAt: now,
      },
    });

    for (const item of pendingItems) {
      await sendReviewNotification(item.id, "denied");
    }

    await maybeSendOrderReviewSummary(orderId);

    return NextResponse.json({ deniedCount: pendingItems.length });
  } catch (error) {
    console.error("Deny order error:", error);
    return NextResponse.json({ error: "Failed to deny order" }, { status: 500 });
  }
}