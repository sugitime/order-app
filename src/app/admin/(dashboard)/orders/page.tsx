export const dynamic = "force-dynamic";

import { ExportOrderedItemsButton } from "@/components/admin/export-ordered-items-button";
import { OrdersList, type AdminOrder } from "@/components/admin/orders-list";
import { syncAmazonOrderNumbersFromLineItems } from "@/lib/amazon-order-numbers";
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
      amazonOrderNumbers: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  await Promise.all(
    orders.map((order) => syncAmazonOrderNumbersFromLineItems(order.id))
  );

  const ordersWithNumbers = await prisma.order.findMany({
    where: { id: { in: orders.map((order) => order.id) } },
    include: {
      amazonOrderNumbers: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const amazonOrderNumbersByOrderId = new Map(
    ordersWithNumbers.map((order) => [order.id, order.amazonOrderNumbers])
  );

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
      amazonOrderId: item.amazonOrderId,
    })),
    activityLogs: order.activityLogs.map((log) => ({
      id: log.id,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      performedByName: log.performedBy?.name ?? null,
    })),
    amazonOrderNumbers: (amazonOrderNumbersByOrderId.get(order.id) ?? []).map(
      (entry) => ({
        id: entry.id,
        orderNumber: entry.orderNumber,
      })
    ),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text">Orders</h1>
        <ExportOrderedItemsButton />
      </div>
      <OrdersList orders={serializedOrders} />
    </div>
  );
}