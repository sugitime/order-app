import { LineItemStatus } from "@prisma/client";
import { placeAmazonOrder } from "@/lib/amazon";
import { getAppSettings } from "@/lib/config";
import { notifyAdmins, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function queueApprovedItems(lineItemIds: string[]) {
  await prisma.lineItem.updateMany({
    where: {
      id: { in: lineItemIds },
      status: LineItemStatus.APPROVED,
    },
    data: {
      status: LineItemStatus.QUEUED,
      queuedAt: new Date(),
    },
  });
}

export async function processQueueItem(lineItemId: string) {
  const item = await prisma.lineItem.findUnique({
    where: { id: lineItemId },
    include: {
      order: {
        include: { department: true },
      },
    },
  });

  if (!item) {
    throw new Error("Line item not found");
  }

  if (item.status !== LineItemStatus.QUEUED && item.status !== LineItemStatus.FAILED) {
    throw new Error("Item is not eligible for ordering");
  }

  await prisma.lineItem.update({
    where: { id: lineItemId },
    data: { status: LineItemStatus.ORDERING },
  });

  const result = await placeAmazonOrder({
    id: item.id,
    description: item.description,
    amazonUrl: item.amazonUrl,
    quantity: item.quantity,
  });

  if (!result.success) {
    await prisma.lineItem.update({
      where: { id: lineItemId },
      data: {
        status: LineItemStatus.FAILED,
        orderError: result.error,
      },
    });
    return { success: false as const, error: result.error };
  }

  const updated = await prisma.lineItem.update({
    where: { id: lineItemId },
    data: {
      status: LineItemStatus.ORDERED,
      orderedAt: new Date(),
      amazonOrderId: result.amazonOrderId,
      trackingNumber: result.trackingNumber ?? null,
      orderError: null,
    },
    include: {
      order: { include: { department: true } },
    },
  });

  const settings = await getAppSettings();
  if (settings.notifications.notifyOnOrder && settings.notifications.adminEmail) {
    await notifyAdmins(
      `Order placed: ${updated.description}`,
      [
        `Item: ${updated.description}`,
        `Requester: ${updated.order.requesterName}`,
        `Department: ${updated.order.department.name}`,
        `Amazon Order ID: ${result.amazonOrderId}`,
        result.trackingNumber ? `Tracking: ${result.trackingNumber}` : "Tracking: pending",
      ].join("\n")
    );
  }

  return {
    success: true as const,
    amazonOrderId: result.amazonOrderId,
    trackingNumber: result.trackingNumber,
  };
}

export async function manuallyCompleteOrder(
  lineItemId: string,
  amazonOrderId: string,
  trackingNumber?: string
) {
  return prisma.lineItem.update({
    where: { id: lineItemId },
    data: {
      status: LineItemStatus.ORDERED,
      orderedAt: new Date(),
      amazonOrderId,
      trackingNumber: trackingNumber ?? null,
      orderError: null,
    },
  });
}

export async function sendSubmissionNotification(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      department: true,
      lineItems: true,
    },
  });

  if (!order) return;

  const settings = await getAppSettings();
  if (!settings.notifications.notifyOnSubmit || !settings.notifications.adminEmail) {
    return;
  }

  const itemList = order.lineItems
    .map(
      (item, index) =>
        `${index + 1}. ${item.description} (qty ${item.quantity})\n   ${item.amazonUrl}`
    )
    .join("\n");

  await notifyAdmins(
    `New order request from ${order.requesterName}`,
    [
      `Requester: ${order.requesterName}`,
      `Department: ${order.department.name}`,
      `Items:\n${itemList}`,
      "",
      `Review in admin: ${process.env.APP_URL ?? ""}/admin/orders`,
    ].join("\n")
  );
}

export async function sendReviewNotification(
  lineItemId: string,
  action: "approved" | "denied"
) {
  const item = await prisma.lineItem.findUnique({
    where: { id: lineItemId },
    include: {
      order: { include: { department: true } },
    },
  });

  if (!item) return;

  const settings = await getAppSettings();
  const shouldNotify =
    action === "approved"
      ? settings.notifications.notifyOnApprove
      : settings.notifications.notifyOnDeny;

  if (!shouldNotify || !settings.notifications.adminEmail) {
    return;
  }

  await sendEmail({
    to: settings.notifications.adminEmail,
    subject: `Line item ${action}: ${item.description}`,
    text: [
      `Item: ${item.description}`,
      `Requester: ${item.order.requesterName}`,
      `Department: ${item.order.department.name}`,
      `Status: ${action}`,
      action === "denied" && item.denialReason ? `Reason: ${item.denialReason}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}