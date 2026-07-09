import { LineItemStatus } from "@prisma/client";
import { addAmazonOrderNumber } from "@/lib/amazon-order-numbers";
import { placeAmazonOrder } from "@/lib/amazon";
import { getAppSettings } from "@/lib/config";
import {
  formatReviewedItemListHtml,
  formatReviewedItemListText,
  formatSubmittedItemListHtml,
  formatSubmittedItemListText,
} from "@/lib/email-item-list";
import { getAdminUrl, renderEmailTemplate } from "@/lib/email-templates";
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
    include: { order: true },
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
    include: { order: true },
  });

  await addAmazonOrderNumber(updated.orderId, result.amazonOrderId);

  const settings = await getAppSettings();
  if (settings.notifications.notifyOnOrder && settings.notifications.adminEmail) {
    const rendered = renderEmailTemplate(settings.emailTemplates.orderPlaced, {
      requesterName: updated.order.requesterName,
      departmentName: updated.order.departmentName,
      itemDescription: updated.description,
      amazonOrderId: result.amazonOrderId,
      trackingNumber: result.trackingNumber ?? "pending",
      adminUrl: getAdminUrl("/admin/queue"),
    });
    await notifyAdmins(rendered);
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
  const item = await prisma.lineItem.update({
    where: { id: lineItemId },
    data: {
      status: LineItemStatus.ORDERED,
      orderedAt: new Date(),
      amazonOrderId,
      trackingNumber: trackingNumber ?? null,
      orderError: null,
    },
  });

  await addAmazonOrderNumber(item.orderId, amazonOrderId);

  return item;
}

export async function sendSubmissionNotification(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lineItems: true },
  });

  if (!order) return;

  const settings = await getAppSettings();
  if (!settings.notifications.notifyOnSubmit || !settings.notifications.adminEmail) {
    return;
  }

  const itemListHtml = formatSubmittedItemListHtml(order.lineItems);
  const itemListText = formatSubmittedItemListText(order.lineItems);

  const rendered = renderEmailTemplate(
    settings.emailTemplates.orderSubmitted,
    {
      requesterName: order.requesterName,
      requesterEmail: order.requesterEmail,
      departmentName: order.departmentName,
      orderId: order.id,
      itemList: itemListHtml,
      adminUrl: getAdminUrl("/admin/orders"),
    },
    { itemList: itemListText }
  );
  await notifyAdmins(rendered);
}

export async function sendSubmissionConfirmationToRequester(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lineItems: true },
  });

  if (!order?.requesterEmail) return;

  const settings = await getAppSettings();
  const itemListHtml = formatSubmittedItemListHtml(order.lineItems);
  const itemListText = formatSubmittedItemListText(order.lineItems);

  const rendered = renderEmailTemplate(
    settings.emailTemplates.orderSubmissionConfirmation,
    {
      requesterName: order.requesterName,
      requesterEmail: order.requesterEmail,
      departmentName: order.departmentName,
      orderId: order.id,
      itemList: itemListHtml,
    },
    { itemList: itemListText }
  );

  await sendEmail({
    to: order.requesterEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}

export async function maybeSendOrderReviewSummary(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lineItems: { orderBy: { createdAt: "asc" } } },
  });

  if (!order?.requesterEmail || order.reviewSummarySentAt) {
    return;
  }

  const allReviewed = order.lineItems.every(
    (item) => item.status !== LineItemStatus.PENDING
  );
  if (!allReviewed || order.lineItems.length === 0) {
    return;
  }

  const itemListHtml = formatReviewedItemListHtml(order.lineItems);
  const itemListText = formatReviewedItemListText(order.lineItems);

  const settings = await getAppSettings();
  const rendered = renderEmailTemplate(
    settings.emailTemplates.orderReviewComplete,
    {
      requesterName: order.requesterName,
      requesterEmail: order.requesterEmail,
      departmentName: order.departmentName,
      orderId: order.id,
      itemList: itemListHtml,
    },
    { itemList: itemListText }
  );

  await sendEmail({
    to: order.requesterEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { reviewSummarySentAt: new Date() },
  });
}

export async function sendReviewNotification(
  lineItemId: string,
  action: "approved" | "denied"
) {
  const item = await prisma.lineItem.findUnique({
    where: { id: lineItemId },
    include: { order: true },
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

  const templateKey = action === "approved" ? "lineItemApproved" : "lineItemDenied";
  const rendered = renderEmailTemplate(settings.emailTemplates[templateKey], {
    requesterName: item.order.requesterName,
    departmentName: item.order.departmentName,
    itemDescription: item.description,
    status: action,
    denialReason: item.denialReason ?? "",
    adminUrl: getAdminUrl("/admin/orders"),
  });

  await sendEmail({
    to: settings.notifications.adminEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}