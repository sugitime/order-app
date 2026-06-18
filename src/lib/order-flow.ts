import { LineItemStatus } from "@prisma/client";
import { placeAmazonOrder } from "@/lib/amazon";
import { formatCurrency } from "@/lib/amazon-product";
import { getAppSettings } from "@/lib/config";
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

function formatSubmittedItemList(
  lineItems: {
    description: string;
    quantity: number;
    amazonUrl: string;
    unitPrice: { toString(): string } | null;
    priceCurrency: string | null;
    isPrimeEligible: boolean | null;
  }[]
): string {
  return lineItems
    .map((item, index) => {
      const price =
        item.unitPrice != null
          ? formatCurrency(Number(item.unitPrice), item.priceCurrency ?? "USD")
          : "price unavailable";
      const prime =
        item.isPrimeEligible === null
          ? "Prime unknown"
          : item.isPrimeEligible
            ? "Prime"
            : "Not Prime";
      return `${index + 1}. ${item.description} (qty ${item.quantity}, ${price}, ${prime})\n   ${item.amazonUrl}`;
    })
    .join("\n");
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

  const itemList = formatSubmittedItemList(order.lineItems);

  const rendered = renderEmailTemplate(settings.emailTemplates.orderSubmitted, {
    requesterName: order.requesterName,
    requesterEmail: order.requesterEmail,
    departmentName: order.departmentName,
    orderId: order.id,
    itemList,
    adminUrl: getAdminUrl("/admin/orders"),
  });
  await notifyAdmins(rendered);
}

export async function sendSubmissionConfirmationToRequester(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lineItems: true },
  });

  if (!order?.requesterEmail) return;

  const settings = await getAppSettings();
  const itemList = formatSubmittedItemList(order.lineItems);

  const rendered = renderEmailTemplate(
    settings.emailTemplates.orderSubmissionConfirmation,
    {
      requesterName: order.requesterName,
      requesterEmail: order.requesterEmail,
      departmentName: order.departmentName,
      orderId: order.id,
      itemList,
    }
  );

  await sendEmail({
    to: order.requesterEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}

function itemReviewLabel(status: LineItemStatus): string {
  if (status === LineItemStatus.DENIED) return "Denied";
  if (status === LineItemStatus.PENDING) return "Pending";
  return "Approved";
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

  const itemLines = order.lineItems.map((item, index) => {
    const status = itemReviewLabel(item.status);
    const reason =
      item.status === LineItemStatus.DENIED && item.denialReason
        ? ` — ${item.denialReason}`
        : "";
    return `${index + 1}. ${item.description} — ${status}${reason}`;
  });

  const settings = await getAppSettings();
  const rendered = renderEmailTemplate(settings.emailTemplates.orderReviewComplete, {
    requesterName: order.requesterName,
    requesterEmail: order.requesterEmail,
    departmentName: order.departmentName,
    orderId: order.id,
    itemList: itemLines.join("\n"),
  });

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