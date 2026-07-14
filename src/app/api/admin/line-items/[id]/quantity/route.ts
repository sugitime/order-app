import { OrderActivityAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { canEditLineItemQuantity } from "@/lib/line-item-quantity";
import { logOrderActivity } from "@/lib/order-activity-log";
import { prisma } from "@/lib/prisma";

const quantitySchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(999),
});

export async function PATCH(
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
    const parsed = quantitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid quantity" },
        { status: 400 }
      );
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

    if (!canEditLineItemQuantity(item.status)) {
      return NextResponse.json(
        { error: "Quantity cannot be changed for this item" },
        { status: 400 }
      );
    }

    if (parsed.data.quantity === item.quantity) {
      return NextResponse.json({ lineItem: item });
    }

    const updated = await prisma.lineItem.update({
      where: { id },
      data: { quantity: parsed.data.quantity },
    });

    await logOrderActivity({
      orderId: updated.orderId,
      lineItemId: id,
      action: OrderActivityAction.LINE_ITEM_QUANTITY_UPDATED,
      performedById: user.id,
      details: `${item.description}: qty ${item.quantity} → ${parsed.data.quantity}`,
    });

    return NextResponse.json({ lineItem: updated });
  } catch (error) {
    console.error("Update line item quantity error:", error);
    return NextResponse.json(
      { error: "Failed to update quantity" },
      { status: 500 }
    );
  }
}