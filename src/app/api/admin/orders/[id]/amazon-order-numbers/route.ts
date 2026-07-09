import { OrderActivityAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import {
  formatAmazonOrderNumbers,
  getAmazonOrderNumbers,
  replaceAmazonOrderNumbers,
} from "@/lib/amazon-order-numbers";
import { logOrderActivity } from "@/lib/order-activity-log";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  orderNumbers: z.array(z.string().min(1, "Order number cannot be empty")),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id, deletedAt: null },
    select: { id: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orderNumbers = await getAmazonOrderNumbers(id);
  return NextResponse.json({ orderNumbers });
}

export async function PUT(
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
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid order numbers" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const previous = await getAmazonOrderNumbers(id);
    const orderNumbers = await replaceAmazonOrderNumbers(id, parsed.data.orderNumbers);

    const previousLabel = formatAmazonOrderNumbers(
      previous.map((record) => record.orderNumber)
    );
    const nextLabel = formatAmazonOrderNumbers(
      orderNumbers.map((record) => record.orderNumber)
    );

    if (previousLabel !== nextLabel) {
      await logOrderActivity({
        orderId: id,
        action: OrderActivityAction.AMAZON_ORDER_NUMBERS_UPDATED,
        performedById: user.id,
        details:
          nextLabel.length > 0
            ? `Amazon order numbers: ${nextLabel}`
            : "Amazon order numbers cleared",
      });
    }

    return NextResponse.json({ orderNumbers });
  } catch (error) {
    console.error("Update Amazon order numbers error:", error);
    return NextResponse.json(
      { error: "Failed to update Amazon order numbers" },
      { status: 500 }
    );
  }
}