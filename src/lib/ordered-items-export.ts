import { LineItemStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type OrderedItemExportRow = {
  requesterName: string;
  departmentName: string;
  description: string;
  amazonUrl: string;
  amazonOrderId: string;
  orderedAt: Date;
};

export const ORDERED_ITEMS_EXPORT_HEADERS = [
  "Name",
  "Department",
  "Item Description",
  "Amazon URL",
  "Amazon Order ID",
  "Date Ordered",
] as const;

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatExportDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export async function fetchOrderedLineItems(): Promise<OrderedItemExportRow[]> {
  const items = await prisma.lineItem.findMany({
    where: {
      status: LineItemStatus.ORDERED,
      orderedAt: { not: null },
      order: { deletedAt: null },
    },
    orderBy: [{ orderedAt: "desc" }, { createdAt: "asc" }],
    include: {
      order: {
        select: {
          requesterName: true,
          departmentName: true,
        },
      },
    },
  });

  return items.map((item) => ({
    requesterName: item.order.requesterName,
    departmentName: item.order.departmentName,
    description: item.description,
    amazonUrl: item.amazonUrl,
    amazonOrderId: item.amazonOrderId ?? "",
    orderedAt: item.orderedAt!,
  }));
}

export function buildOrderedItemsCsv(rows: OrderedItemExportRow[]): string {
  const lines = [
    ORDERED_ITEMS_EXPORT_HEADERS.join(","),
    ...rows.map((row) =>
      [
        row.requesterName,
        row.departmentName,
        row.description,
        row.amazonUrl,
        row.amazonOrderId,
        formatExportDate(row.orderedAt),
      ]
        .map((value) => escapeCsvCell(value))
        .join(",")
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}

export function orderedItemsExportFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `ordered-items-${stamp}.csv`;
}