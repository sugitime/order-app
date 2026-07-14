export const dynamic = "force-dynamic";

import { LineItemStatus } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { ExportOrderedItemsButton } from "@/components/admin/export-ordered-items-button";
import { FulfilledQueueList } from "@/components/admin/fulfilled-queue-list";
import { LineItemQuantityEditor } from "@/components/admin/line-item-quantity-editor";
import { ProcessAllButton } from "@/components/admin/process-all-button";
import { QueueItemActions } from "@/components/admin/queue-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { PrimeBadge } from "@/components/order/prime-badge";
import { syncAmazonOrderNumbersFromLineItems } from "@/lib/amazon-order-numbers";
import { formatCurrency } from "@/lib/amazon-product";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function OrderQueuePage() {
  const items = await prisma.lineItem.findMany({
    where: {
      order: { deletedAt: null },
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
      order: {
        include: {
          amazonOrderNumbers: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  const fulfilledOrderIds = [
    ...new Set(
      items
        .filter((item) => item.status === LineItemStatus.ORDERED)
        .map((item) => item.orderId)
    ),
  ];

  await Promise.all(
    fulfilledOrderIds.map((orderId) => syncAmazonOrderNumbersFromLineItems(orderId))
  );

  const refreshedFulfilledOrders =
    fulfilledOrderIds.length > 0
      ? await prisma.order.findMany({
          where: { id: { in: fulfilledOrderIds } },
          include: {
            amazonOrderNumbers: {
              orderBy: { createdAt: "asc" },
            },
          },
        })
      : [];

  const amazonOrderNumbersByOrderId = new Map(
    refreshedFulfilledOrders.map((order) => [order.id, order.amazonOrderNumbers])
  );

  const activeItems = items.filter((item) => item.status !== LineItemStatus.ORDERED);
  const fulfilledItems = items
    .filter((item) => item.status === LineItemStatus.ORDERED)
    .map((item) => ({
      ...item,
      order: {
        ...item.order,
        amazonOrderNumbers: amazonOrderNumbersByOrderId.get(item.orderId) ?? [],
      },
    }));

  const pendingCount = activeItems.filter(
    (item) => item.status === "QUEUED" || item.status === "FAILED"
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Order Queue</h1>
          <p className="mt-1 text-sm text-text-muted">
            Approved items ready for Amazon ordering. Auto-order uses configured API credentials;
            you can also enter order details manually.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportOrderedItemsButton />
          <ProcessAllButton count={pendingCount} />
        </div>
      </div>

      {activeItems.length === 0 ? (
        <Card>
          <p className="text-center text-text-muted">No items awaiting Amazon ordering.</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg shadow-black/20">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Item</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Requester</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Order ID</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Tracking</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeItems.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-medium text-text">{item.description}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-text-muted">
                      <LineItemQuantityEditor
                        lineItemId={item.id}
                        quantity={item.quantity}
                        status={item.status}
                      />
                      {item.unitPrice != null && (
                        <>
                          {" "}
                          ·{" "}
                          {formatCurrency(
                            Number(item.unitPrice),
                            item.priceCurrency ?? "USD"
                          )}{" "}
                          each
                        </>
                      )}
                    </p>
                    <div className="mt-1">
                      <PrimeBadge isPrimeEligible={item.isPrimeEligible} />
                    </div>
                    <a
                      href={item.amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-brand-600 hover:underline"
                    >
                      Amazon link
                    </a>
                    {item.orderError && (
                      <p className="mt-2 text-xs text-red-400">{item.orderError}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-text-muted">
                    <p>{item.order.requesterName}</p>
                    <p className="text-xs text-text-muted">{item.order.departmentName}</p>
                    {item.queuedAt && (
                      <p className="mt-1 text-xs text-text-muted">
                        Queued {formatDate(item.queuedAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-4 text-text-muted">
                    {item.amazonOrderId ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-text-muted">
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

      <FulfilledQueueList items={fulfilledItems} />
    </div>
  );
}