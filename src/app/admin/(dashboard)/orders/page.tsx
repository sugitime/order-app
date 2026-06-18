export const dynamic = "force-dynamic";

import { OrdersList, type AdminOrder } from "@/components/admin/orders-list";
import { prisma } from "@/lib/prisma";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    orderBy: { submittedAt: "desc" },
    include: {
      lineItems: {
        orderBy: { createdAt: "asc" },
        include: {
          reviewedBy: { select: { name: true } },
        },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        include: {
          performedBy: { select: { name: true } },
        },
      },
    },
  });

  const serializedOrders: AdminOrder[] = orders.map((order) => ({
    id: order.id,
    requesterName: order.requesterName,
    requesterEmail: order.requesterEmail,
    departmentName: order.departmentName,
    submittedAt: order.submittedAt.toISOString(),
    lineItems: order.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      amazonUrl: item.amazonUrl,
      justification: item.justification,
      status: item.status,
      denialReason: item.denialReason,
      unitPrice: item.unitPrice?.toString() ?? null,
      priceCurrency: item.priceCurrency,
      isPrimeEligible: item.isPrimeEligible,
      priceLookupError: item.priceLookupError,
      reviewedAt: item.reviewedAt?.toISOString() ?? null,
      reviewedByName: item.reviewedBy?.name ?? null,
    })),
    activityLogs: order.activityLogs.map((log) => ({
      id: log.id,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      performedByName: log.performedBy.name,
    })),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text">Orders</h1>
      </div>
      <OrdersList orders={serializedOrders} />
    </div>
  );
}