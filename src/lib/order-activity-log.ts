import { OrderActivityAction } from "@prisma/client";
import {
  formatActivityAction,
  formatActivityPerformer,
} from "@/lib/order-activity-log-format";
import { prisma } from "@/lib/prisma";

type LogOrderActivityInput = {
  orderId: string;
  lineItemId?: string;
  action: OrderActivityAction;
  performedById?: string;
  details?: string;
};

export async function logOrderActivity(input: LogOrderActivityInput) {
  const log = await prisma.orderActivityLog.create({
    data: {
      orderId: input.orderId,
      lineItemId: input.lineItemId,
      action: input.action,
      performedById: input.performedById ?? null,
      details: input.details?.trim() || null,
    },
    include: {
      performedBy: { select: { name: true } },
    },
  });

  const performer = formatActivityPerformer(log.performedBy?.name);
  const actionLabel = formatActivityAction(log.action);
  const detailsSuffix = log.details ? ` — ${log.details}` : "";
  console.info(
    `[order-activity] ${performer} ${actionLabel} on order ${log.orderId}${detailsSuffix}`
  );

  return log;
}