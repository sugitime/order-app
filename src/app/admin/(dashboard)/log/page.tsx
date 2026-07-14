export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ActivityLogList } from "@/components/admin/activity-log-list";
import { prisma } from "@/lib/prisma";

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId: orderIdQuery } = await searchParams;
  const orderIdFilter = orderIdQuery?.trim() ?? "";

  const orderIdsFromAmazon = orderIdFilter
    ? [
        ...new Set([
          ...(
            await prisma.lineItem.findMany({
              where: {
                amazonOrderId: {
                  contains: orderIdFilter,
                  mode: "insensitive",
                },
              },
              select: { orderId: true },
              distinct: ["orderId"],
            })
          ).map((item) => item.orderId),
          ...(
            await prisma.amazonOrderNumber.findMany({
              where: {
                orderNumber: {
                  contains: orderIdFilter,
                  mode: "insensitive",
                },
              },
              select: { orderId: true },
              distinct: ["orderId"],
            })
          ).map((entry) => entry.orderId),
        ]),
      ]
    : [];

  const logs = await prisma.orderActivityLog.findMany({
    where: orderIdFilter
      ? {
          OR: [
            {
              orderId: {
                contains: orderIdFilter,
                mode: "insensitive",
              },
            },
            ...(orderIdsFromAmazon.length
              ? [{ orderId: { in: orderIdsFromAmazon } }]
              : []),
            {
              details: {
                contains: orderIdFilter,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      performedBy: { select: { name: true, email: true } },
      order: {
        select: {
          requesterName: true,
          deletedAt: true,
        },
      },
    },
  });

  const serializedLogs = logs.map((log) => ({
    id: log.id,
    orderId: log.orderId,
    action: log.action,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
    performedByName: log.performedBy?.name ?? null,
    performedByEmail: log.performedBy?.email ?? null,
    requesterName: log.order.requesterName,
    orderDeleted: log.order.deletedAt != null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text">Activity log</h1>
        <p className="mt-1 text-sm text-text-muted">
          Full audit trail of everything that happens on an order. Search by order reference ID
          or Amazon order number to see all related events.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-text-muted">Loading...</p>}>
        <ActivityLogList logs={serializedLogs} initialOrderId={orderIdFilter} />
      </Suspense>
    </div>
  );
}