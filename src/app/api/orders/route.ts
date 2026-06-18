import { NextResponse } from "next/server";
import { lookupAmazonProduct } from "@/lib/amazon-product";
import { prisma } from "@/lib/prisma";
import {
  sendSubmissionConfirmationToRequester,
  sendSubmissionNotification,
} from "@/lib/order-flow";
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

    const { requesterName, requesterEmail, departmentName, acknowledged, lineItems } =
      parsed.data;
    const enrichedItems = await Promise.all(
      lineItems.map(async (item) => {
        const lookup = await lookupAmazonProduct(item.amazonUrl);
        return {
          description: lookup.title?.trim() || item.description.trim(),
          amazonUrl: item.amazonUrl,
          quantity: item.quantity,
          justification: item.justification,
          unitPrice: lookup.unitPrice,
          priceCurrency: lookup.priceCurrency,
          isPrimeEligible: lookup.isPrimeEligible,
          priceFetchedAt: new Date(),
          priceLookupError: lookup.error ?? null,
        };
      })
    );

    const order = await prisma.order.create({
      data: {
        requesterName,
        requesterEmail: requesterEmail.trim().toLowerCase(),
        departmentName: departmentName.trim(),
        acknowledged,
        lineItems: {
          create: enrichedItems,
        },
      },
      include: { lineItems: true },
    });

    await Promise.all([
      sendSubmissionNotification(order.id),
      sendSubmissionConfirmationToRequester(order.id),
    ]);

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("Order submission error:", error);
    return NextResponse.json({ error: "Failed to submit order" }, { status: 500 });
  }
}