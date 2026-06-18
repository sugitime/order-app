export const dynamic = "force-dynamic";

import { Card } from "@/components/ui/card";
import { LineItemActions } from "@/components/admin/line-item-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      lineItems: {
        orderBy: { createdAt: "asc" },
        include: {
          reviewedBy: { select: { name: true } },
        },
      },
    },
  });

  const pendingCount = orders.reduce(
    (sum, order) =>
      sum + order.lineItems.filter((item) => item.status === "PENDING").length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Orders</h1>
        <p className="mt-1 text-sm text-text-muted">
          Review and approve or deny each line item individually.
          {pendingCount > 0 && (
            <span className="ml-2 font-medium text-amber-700">
              {pendingCount} item(s) awaiting review
            </span>
          )}
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <p className="text-center text-text-muted">No orders yet.</p>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="font-semibold text-text">{order.requesterName}</h2>
                <p className="text-sm text-text-muted">
                  {order.departmentName} · Submitted {formatDate(order.submittedAt)}
                </p>
              </div>
              <p className="text-xs text-text-muted">{order.id}</p>
            </div>

            <div className="space-y-4">
              {order.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-lg border border-border bg-surface-muted/50 p-4 lg:grid-cols-[1fr_auto]"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-text">{item.description}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-sm text-text-muted">
                      Qty {item.quantity} ·{" "}
                      <a
                        href={item.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        View on Amazon
                      </a>
                    </p>
                    <p className="text-sm text-text-muted">
                      <span className="font-medium text-text">Justification:</span>{" "}
                      {item.justification}
                    </p>
                    {item.denialReason && (
                      <p className="text-sm text-red-400">
                        <span className="font-medium">Denial reason:</span>{" "}
                        {item.denialReason}
                      </p>
                    )}
                    {item.reviewedBy && (
                      <p className="text-xs text-text-muted">
                        Reviewed by {item.reviewedBy.name}
                        {item.reviewedAt && ` on ${formatDate(item.reviewedAt)}`}
                      </p>
                    )}
                  </div>
                  <LineItemActions lineItemId={item.id} status={item.status} />
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}