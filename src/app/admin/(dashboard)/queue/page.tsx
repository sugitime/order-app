export const dynamic = "force-dynamic";

import { LineItemStatus } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { ProcessAllButton } from "@/components/admin/process-all-button";
import { QueueItemActions } from "@/components/admin/queue-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function OrderQueuePage() {
  const items = await prisma.lineItem.findMany({
    where: {
      status: {
        in: [
          LineItemStatus.QUEUED,
          LineItemStatus.ORDERING,
          LineItemStatus.ORDERED,
          LineItemStatus.FAILED,
        ],
      },
    },
    orderBy: [{ status: "asc" }, { queuedAt: "asc" }],
    include: {
      order: { include: { department: true } },
    },
  });

  const pendingCount = items.filter(
    (item) => item.status === "QUEUED" || item.status === "FAILED"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Order Queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Approved items ready for Amazon ordering. Auto-order uses configured API
            credentials; you can also enter order details manually.
          </p>
        </div>
        <ProcessAllButton count={pendingCount} />
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500">No items in the queue.</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Item</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Requester</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Order ID</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tracking</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900">{item.description}</p>
                    <p className="mt-1 text-xs text-slate-500">Qty {item.quantity}</p>
                    <a
                      href={item.amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-brand-600 hover:underline"
                    >
                      Amazon link
                    </a>
                    {item.orderError && (
                      <p className="mt-2 text-xs text-red-600">{item.orderError}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <p>{item.order.requesterName}</p>
                    <p className="text-xs text-slate-400">{item.order.department.name}</p>
                    {item.queuedAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        Queued {formatDate(item.queuedAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {item.amazonOrderId ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {item.trackingNumber ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <QueueItemActions lineItemId={item.id} status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}