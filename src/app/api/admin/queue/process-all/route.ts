import { LineItemStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { processQueueItem } from "@/lib/order-flow";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queuedItems = await prisma.lineItem.findMany({
    where: {
      status: { in: [LineItemStatus.QUEUED, LineItemStatus.FAILED] },
    },
    orderBy: { queuedAt: "asc" },
    select: { id: true },
  });

  const results = [];
  for (const item of queuedItems) {
    const result = await processQueueItem(item.id);
    results.push({ id: item.id, ...result });
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}