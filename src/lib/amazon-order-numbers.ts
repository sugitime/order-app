import { prisma } from "@/lib/prisma";

export type AmazonOrderNumberRecord = {
  id: string;
  orderNumber: string;
};

function normalizeOrderNumbers(orderNumbers: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of orderNumbers) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export async function syncAmazonOrderNumbersFromLineItems(orderId: string) {
  const lineItems = await prisma.lineItem.findMany({
    where: {
      orderId,
      amazonOrderId: { not: null },
    },
    select: { amazonOrderId: true },
  });

  const orderNumbers = normalizeOrderNumbers(
    lineItems.map((item) => item.amazonOrderId ?? "")
  );

  for (const orderNumber of orderNumbers) {
    await prisma.amazonOrderNumber.upsert({
      where: {
        orderId_orderNumber: { orderId, orderNumber },
      },
      create: { orderId, orderNumber },
      update: {},
    });
  }
}

export async function getAmazonOrderNumbers(
  orderId: string
): Promise<AmazonOrderNumberRecord[]> {
  await syncAmazonOrderNumbersFromLineItems(orderId);

  const records = await prisma.amazonOrderNumber.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    select: { id: true, orderNumber: true },
  });

  return records;
}

export async function addAmazonOrderNumber(orderId: string, orderNumber: string) {
  const trimmed = orderNumber.trim();
  if (!trimmed) return;

  await prisma.amazonOrderNumber.upsert({
    where: {
      orderId_orderNumber: { orderId, orderNumber: trimmed },
    },
    create: { orderId, orderNumber: trimmed },
    update: {},
  });
}

export async function replaceAmazonOrderNumbers(
  orderId: string,
  orderNumbers: string[]
): Promise<AmazonOrderNumberRecord[]> {
  const normalized = normalizeOrderNumbers(orderNumbers);

  await prisma.$transaction(async (tx) => {
    await tx.amazonOrderNumber.deleteMany({ where: { orderId } });

    if (normalized.length > 0) {
      await tx.amazonOrderNumber.createMany({
        data: normalized.map((orderNumber) => ({ orderId, orderNumber })),
      });
    }
  });

  return getAmazonOrderNumbers(orderId);
}

export function formatAmazonOrderNumbers(orderNumbers: string[]): string {
  return orderNumbers.join(", ");
}