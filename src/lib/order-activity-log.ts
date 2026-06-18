import { OrderActivityAction } from "@prisma/client";
import { formatActivityAction } from "@/lib/order-activity-log-format";
import { prisma } from "@/lib/prisma";

type LogOrderActivityInput = {
  orderId: string;
  lineItemId?: string;
  action: OrderActivityAction;
  performedById: string;
  details?: string;
};

export async function logOrderActivity(input: LogOrderActivityInput) {
  const log = await prisma.orderActivityLog.create({
    data: {
      orderId: input.orderId,
      lineItemId: input.lineItemId,
      action: input.action,
      performedById: input.performedById,
      details: input.details?.trim() || null,
    },
    include: {
      performedBy: { select: { name: true } },
    },
  });

  const actionLabel = formatActivityAction(log.action);
  const detailsSuffix = log.details ? ` — ${log.details}` : "";
  console.info(
    `[order-activity] ${log.performedBy.name} ${actionLabel} on order ${log.orderId}${detailsSuffix}`
  );

  return log;
}