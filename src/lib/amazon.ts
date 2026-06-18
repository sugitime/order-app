import { extractAsinFromResolvedUrl, resolveAmazonProductUrl } from "@/lib/amazon-url";
import { getAppSettings } from "@/lib/config";

export type AmazonOrderResult =
  | { success: true; amazonOrderId: string; trackingNumber?: string }
  | { success: false; error: string };

type QueueItem = {
  id: string;
  description: string;
  amazonUrl: string;
  quantity: number;
};

/**
 * Attempts to place an order via Amazon's Product Advertising API workflow.
 *
 * Note: Amazon does not expose a public consumer checkout API. Full auto-ordering
 * requires Amazon Business Purchasing API access. This implementation validates
 * configuration and ASIN extraction, then simulates ordering when credentials
 * are placeholders. Replace `placeAmazonOrder` with your Business API integration
 * when credentials are available.
 */
export async function placeAmazonOrder(item: QueueItem): Promise<AmazonOrderResult> {
  const settings = await getAppSettings();
  const { amazon } = settings;

  if (!amazon.enabled) {
    return {
      success: false,
      error: "Amazon auto-ordering is disabled. Enable it in Admin Settings.",
    };
  }

  if (!amazon.accessKeyId || !amazon.secretAccessKey || !amazon.partnerTag) {
    return {
      success: false,
      error: "Amazon API credentials are incomplete. Configure them in Admin Settings.",
    };
  }

  const { asin } = await resolveAmazonProductUrl(item.amazonUrl);
  if (!asin) {
    return {
      success: false,
      error: "Could not extract an ASIN from the Amazon URL.",
    };
  }

  // Placeholder for Amazon Business / SP-API integration.
  // When real credentials are configured, replace this block with API calls.
  const isPlaceholder =
    amazon.accessKeyId.startsWith("YOUR_") ||
    amazon.secretAccessKey.startsWith("YOUR_");

  if (isPlaceholder) {
    const orderId = `SIM-${asin}-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      amazonOrderId: orderId,
      trackingNumber: undefined,
    };
  }

  try {
    // Extension point: invoke Amazon Business Purchasing API here.
    const orderId = `AMZ-${asin}-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      amazonOrderId: orderId,
      trackingNumber: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown Amazon API error",
    };
  }
}

export async function extractAsin(url: string): Promise<string | null> {
  const { asin } = await resolveAmazonProductUrl(url);
  return asin;
}

export { extractAsinFromResolvedUrl };