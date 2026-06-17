import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { manuallyCompleteOrder } from "@/lib/order-flow";
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

    const item = await manuallyCompleteOrder(
      id,
      parsed.data.amazonOrderId,
      parsed.data.trackingNumber
    );

    return NextResponse.json({ lineItem: item });
  } catch (error) {
    console.error("Manual complete error:", error);
    return NextResponse.json({ error: "Failed to complete order" }, { status: 500 });
  }
}