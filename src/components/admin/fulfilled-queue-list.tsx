import type { LineItem, Order } from "@prisma/client";
import { OrderDeleteButton } from "@/components/admin/order-delete-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { PrimeBadge } from "@/components/order/prime-badge";
import { formatCurrency } from "@/lib/amazon-product";
import { formatDate } from "@/lib/utils";

type FulfilledQueueItem = LineItem & { order: Order };

export function FulfilledQueueList({ items }: { items: FulfilledQueueItem[] }) {
  if (items.length === 0) {
    return null;
  }

  const byOrder = new Map<string, FulfilledQueueItem[]>();
  for (const item of items) {
    const group = byOrder.get(item.orderId) ?? [];
    group.push(item);
    byOrder.set(item.orderId, group);
  }

  const orderGroups = [...byOrder.entries()].sort(([, aItems], [, bItems]) => {
    const aDate = aItems[0]?.orderedAt?.getTime() ?? 0;
    const bDate = bItems[0]?.orderedAt?.getTime() ?? 0;
    return bDate - aDate;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Fulfilled</h2>
        <p className="mt-1 text-sm text-text-muted">
          Items that have been ordered on Amazon. Delete an order to remove it from the queue and
          orders list.
        </p>
      </div>

      <div className="space-y-4">
        {orderGroups.map(([orderId, orderItems]) => {
          const order = orderItems[0].order;

          return (
            <div
              key={orderId}
              className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg shadow-black/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface-muted/60 px-4 py-3">
                <div>
                  <p className="font-medium text-text">{order.requesterName}</p>
                  <p className="text-xs text-text-muted">
                    {order.departmentName} · {orderItems.length} item(s) ordered
                  </p>
                </div>
                <OrderDeleteButton orderId={orderId} />
              </div>

              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Item</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Order ID</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Tracking</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Ordered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orderItems.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-4">
                        <p className="font-medium text-text">{item.description}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          Qty {item.quantity}
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
                      <td className="px-4 py-4 text-text-muted">
                        {item.orderedAt ? formatDate(item.orderedAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}