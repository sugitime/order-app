import crypto from "crypto";
import { getAppSettings } from "@/lib/config";
import { resolveAmazonProductUrl } from "@/lib/amazon-url";

export type AmazonProductLookup = {
  asin: string;
  title?: string;
  unitPrice: number | null;
  priceCurrency: string;
  priceDisplay: string | null;
  isPrimeEligible: boolean | null;
  source: "paapi" | "scrape" | null;
  error?: string;
};

type MarketplaceConfig = {
  host: string;
  region: string;
  marketplace: string;
  currency: string;
};

const MARKETPLACE_BY_HOST: Record<string, MarketplaceConfig> = {
  "amazon.com": {
    host: "webservices.amazon.com",
    region: "us-east-1",
    marketplace: "www.amazon.com",
    currency: "USD",
  },
  "amazon.co.uk": {
    host: "webservices.amazon.co.uk",
    region: "eu-west-1",
    marketplace: "www.amazon.co.uk",
    currency: "GBP",
  },
  "amazon.ca": {
    host: "webservices.amazon.ca",
    region: "us-east-1",
    marketplace: "www.amazon.ca",
    currency: "CAD",
  },
  "amazon.de": {
    host: "webservices.amazon.de",
    region: "eu-west-1",
    marketplace: "www.amazon.de",
    currency: "EUR",
  },
};

function getMarketplaceFromUrl(url: string): MarketplaceConfig {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const key = Object.keys(MARKETPLACE_BY_HOST).find((domain) => hostname.endsWith(domain));
    return key ? MARKETPLACE_BY_HOST[key] : MARKETPLACE_BY_HOST["amazon.com"];
  } catch {
    return MARKETPLACE_BY_HOST["amazon.com"];
  }
}

function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string
) {
  const kDate = crypto.createHmac("sha256", `AWS4${key}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(regionName).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(serviceName).digest();
  return crypto.createHmac("sha256", kService).update("aws4_request").digest();
}

async function lookupViaPaApi(
  asin: string,
  amazonUrl: string
): Promise<AmazonProductLookup | null> {
  const settings = await getAppSettings();
  const { amazon } = settings;

  if (
    !amazon.accessKeyId ||
    !amazon.secretAccessKey ||
    !amazon.partnerTag ||
    amazon.accessKeyId.startsWith("YOUR_") ||
    amazon.secretAccessKey.startsWith("YOUR_")
  ) {
    return null;
  }

  const marketplace = getMarketplaceFromUrl(amazonUrl);
  const host = marketplace.host;
  const region = amazon.region || marketplace.region;
  const payload = {
    ItemIds: [asin],
    Resources: [
      "ItemInfo.Title",
      "Offers.Listings.Price",
      "Offers.Listings.DeliveryInfo.IsPrimeEligible",
    ],
    PartnerTag: amazon.partnerTag,
    PartnerType: "Associates",
    Marketplace: amazon.marketplaceId
      ? marketplace.marketplace
      : marketplace.marketplace,
  };

  const body = JSON.stringify(payload);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const canonicalUri = "/paapi5/getitems";
  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";
  const canonicalHeaders =
    `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${host}\n` +
    `x-amz-date:${amzDate}\nx-amz-target:${target}\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const payloadHash = crypto.createHash("sha256").update(body).digest("hex");
  const canonicalRequest = `POST\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${region}/ProductAdvertisingAPI/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex")}`;
  const signingKey = getSignatureKey(amazon.secretAccessKey, dateStamp, region, "ProductAdvertisingAPI");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${amazon.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}${canonicalUri}`, {
    method: "POST",
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      host,
      "x-amz-date": amzDate,
      "x-amz-target": target,
      Authorization: authorization,
    },
    body,
  });

  const data = (await response.json()) as {
    ItemsResult?: {
      Items?: Array<{
        ASIN?: string;
        ItemInfo?: { Title?: { DisplayValue?: string } };
        Offers?: {
          Listings?: Array<{
            Price?: { Amount?: number; Currency?: string; DisplayAmount?: string };
            DeliveryInfo?: { IsPrimeEligible?: boolean };
          }>;
        };
      }>;
    };
    Errors?: Array<{ Message?: string }>;
  };

  if (!response.ok || data.Errors?.length) {
    return null;
  }

  const item = data.ItemsResult?.Items?.[0];
  const listing = item?.Offers?.Listings?.[0];
  const price = listing?.Price;

  if (!price?.Amount) {
    return null;
  }

  return {
    asin,
    title: item?.ItemInfo?.Title?.DisplayValue,
    unitPrice: price.Amount,
    priceCurrency: price.Currency ?? marketplace.currency,
    priceDisplay: price.DisplayAmount ?? null,
    isPrimeEligible: listing?.DeliveryInfo?.IsPrimeEligible ?? null,
    source: "paapi",
  };
}

function parseAmazonHtml(html: string, asin: string, currency: string): AmazonProductLookup {
  let unitPrice: number | null = null;
  let priceDisplay: string | null = null;
  let title: string | undefined;
  let isPrimeEligible: boolean | null = null;

  const priceToPayMatch = html.match(
    /"priceToPay"\s*:\s*\{[^}]*"amount"\s*:\s*([\d.]+)[^}]*"currency"\s*:\s*"([A-Z]+)"/
  );
  if (priceToPayMatch) {
    unitPrice = parseFloat(priceToPayMatch[1]);
    priceDisplay = formatCurrency(unitPrice, priceToPayMatch[2]);
  }

  if (unitPrice === null) {
    const buyboxMatch = html.match(
      /"buyboxPrice"\s*:\s*\{[^}]*"amount"\s*:\s*([\d.]+)[^}]*"currency"\s*:\s*"([A-Z]+)"/
    );
    if (buyboxMatch) {
      unitPrice = parseFloat(buyboxMatch[1]);
      priceDisplay = formatCurrency(unitPrice, buyboxMatch[2]);
    }
  }

  if (unitPrice === null) {
    const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)];
    for (const block of jsonLdBlocks) {
      try {
        const parsed = JSON.parse(block[1]) as Record<string, unknown>;
        const products = Array.isArray(parsed) ? parsed : [parsed];
        for (const product of products) {
          if (product["@type"] !== "Product") continue;
          if (typeof product.name === "string") title = product.name;
          const offers = product.offers as
            | { price?: string | number; priceCurrency?: string }
            | Array<{ price?: string | number; priceCurrency?: string }>
            | undefined;
          const offer = Array.isArray(offers) ? offers[0] : offers;
          if (offer?.price) {
            unitPrice = parseFloat(String(offer.price));
            const offerCurrency = offer.priceCurrency ?? currency;
            priceDisplay = formatCurrency(unitPrice, offerCurrency);
            break;
          }
        }
      } catch {
        // ignore malformed JSON-LD
      }
      if (unitPrice !== null) break;
    }
  }

  if (unitPrice === null) {
    const wholeMatch = html.match(/class="a-price-whole">([\d,]+)</);
    const fractionMatch = html.match(/class="a-price-fraction">(\d{2})</);
    if (wholeMatch) {
      const whole = wholeMatch[1].replace(/,/g, "");
      const fraction = fractionMatch?.[1] ?? "00";
      unitPrice = parseFloat(`${whole}.${fraction}`);
      priceDisplay = formatCurrency(unitPrice, currency);
    }
  }

  if (/"isPrime(?:Eligible)?"\s*:\s*true/i.test(html)) {
    isPrimeEligible = true;
  } else if (/"isPrime(?:Eligible)?"\s*:\s*false/i.test(html)) {
    isPrimeEligible = false;
  } else if (/a-icon-prime|i-prime-icon|prime-badge|DeliveryBlockPrime/i.test(html)) {
    isPrimeEligible = true;
  }

  const titleMatch = html.match(/<span id="productTitle"[^>]*>\s*([^<]+?)\s*<\/span>/);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  if (unitPrice === null) {
    return {
      asin,
      title,
      unitPrice: null,
      priceCurrency: currency,
      priceDisplay: null,
      isPrimeEligible,
      source: null,
      error: "Could not determine price from the Amazon page.",
    };
  }

  return {
    asin,
    title,
    unitPrice,
    priceCurrency: currency,
    priceDisplay,
    isPrimeEligible,
    source: "scrape",
  };
}

async function lookupViaScrape(
  amazonUrl: string,
  asin: string
): Promise<AmazonProductLookup> {
  const marketplace = getMarketplaceFromUrl(amazonUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(amazonUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    const html = await response.text();

    if (
      !response.ok ||
      /automated access|Product Advertising API|api\/detail\/main\.html/i.test(html)
    ) {
      return {
        asin,
        unitPrice: null,
        priceCurrency: marketplace.currency,
        priceDisplay: null,
        isPrimeEligible: null,
        source: null,
        error:
          "Could not read price from Amazon. Configure Amazon Product Advertising API credentials in Admin Settings for reliable lookups.",
      };
    }

    return parseAmazonHtml(html, asin, marketplace.currency);
  } catch (error) {
    return {
      asin,
      unitPrice: null,
      priceCurrency: marketplace.currency,
      priceDisplay: null,
      isPrimeEligible: null,
      source: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch product details from Amazon.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export async function lookupAmazonProduct(amazonUrl: string): Promise<AmazonProductLookup> {
  const { resolvedUrl, asin } = await resolveAmazonProductUrl(amazonUrl);
  if (!asin) {
    return {
      asin: "",
      unitPrice: null,
      priceCurrency: "USD",
      priceDisplay: null,
      isPrimeEligible: null,
      source: null,
      error: "Could not extract an ASIN from the Amazon URL.",
    };
  }

  try {
    const paapiResult = await lookupViaPaApi(asin, resolvedUrl);
    if (paapiResult?.unitPrice) {
      return paapiResult;
    }
  } catch {
    // fall through to scraping
  }

  return lookupViaScrape(resolvedUrl, asin);
}