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

  const logs = await prisma.orderActivityLog.findMany({
    where: orderIdFilter
      ? {
          orderId: {
            contains: orderIdFilter,
            mode: "insensitive",
          },
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      performedBy: { select: { name: true } },
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
    requesterName: log.order.requesterName,
    orderDeleted: log.order.deletedAt != null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text">Activity log</h1>
        <p className="mt-1 text-sm text-text-muted">
          Full audit trail of everything that happens on an order. Search by order reference ID
          to see all related events.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-text-muted">Loading...</p>}>
        <ActivityLogList logs={serializedLogs} initialOrderId={orderIdFilter} />
      </Suspense>
    </div>
  );
}