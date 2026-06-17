import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { processQueueItem } from "@/lib/order-flow";

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
    const result = await processQueueItem(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Queue process error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process item" },
      { status: 500 }
    );
  }
}