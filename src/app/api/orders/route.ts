import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSubmissionNotification } from "@/lib/order-flow";
import { orderSubmitSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = orderSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { requesterName, departmentName, acknowledged, lineItems } = parsed.data;

    const order = await prisma.order.create({
      data: {
        requesterName,
        departmentName: departmentName.trim(),
        acknowledged,
        lineItems: {
          create: lineItems.map((item) => ({
            description: item.description,
            amazonUrl: item.amazonUrl,
            quantity: item.quantity,
            justification: item.justification,
          })),
        },
      },
      include: { lineItems: true },
    });

    await sendSubmissionNotification(order.id);

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("Order submission error:", error);
    return NextResponse.json({ error: "Failed to submit order" }, { status: 500 });
  }
}