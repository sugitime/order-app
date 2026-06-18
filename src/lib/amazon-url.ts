const AMAZON_MARKETPLACE_HOST =
  /^amazon\.(com|co\.uk|de|fr|ca|co\.jp|in|com\.au|com\.mx|it|es|nl|se|pl|com\.br|ae|sa|sg|com\.tr)$/i;

const AMAZON_SHORT_HOSTS = new Set(["a.co", "amzn.to", "amzn.com"]);

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const ASIN_PATTERN = /[A-Z0-9]{10}/i;

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

export function isAmazonShortHost(hostname: string): boolean {
  return AMAZON_SHORT_HOSTS.has(normalizeHostname(hostname));
}

export function isAmazonProductUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const host = normalizeHostname(parsed.hostname);
    return (
      isAmazonShortHost(host) ||
      AMAZON_MARKETPLACE_HOST.test(host) ||
      host === "smile.amazon.com"
    );
  } catch {
    return false;
  }
}

export function extractAsinFromResolvedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(
      /\/(?:dp|gp\/product|gp\/aw\/d|d)\/([A-Z0-9]{10})(?:[/?#]|$)/i
    );
    if (pathMatch) return pathMatch[1].toUpperCase();

    const anywhereMatch = url.match(/\/dp\/([A-Z0-9]{10})(?:[/?#]|$)/i);
    if (anywhereMatch) return anywhereMatch[1].toUpperCase();

    const asinParam = parsed.searchParams.get("asin");
    if (asinParam && ASIN_PATTERN.test(asinParam)) {
      return asinParam.toUpperCase();
    }

    return null;
  } catch {
    return null;
  }
}

function extractAsinFromHtml(html: string): string | null {
  const candidates: string[] = [];

  const patterns = [
    /"asin"\s*:\s*"([A-Z0-9]{10})"/gi,
    /data-asin="([A-Z0-9]{10})"/gi,
    /\/dp\/([A-Z0-9]{10})/gi,
    /property="og:url"\s+content="([^"]+)"/gi,
    /rel="canonical"\s+href="([^"]+)"/gi,
    /href="(https?:\/\/[^"]*\/dp\/[A-Z0-9]{10}[^"]*)"/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const value = match[1];
      if (!value) continue;
      if (value.includes("/dp/") || value.includes("amazon.")) {
        const asin = extractAsinFromResolvedUrl(value);
        if (asin) candidates.push(asin);
      } else if (ASIN_PATTERN.test(value)) {
        candidates.push(value.toUpperCase());
      }
    }
  }

  return candidates[0] ?? null;
}

function extractMetaRefreshUrl(html: string, baseUrl: string): string | null {
  const match = html.match(
    /http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"';]+)/i
  );
  if (!match?.[1]) return null;

  try {
    return new URL(match[1].trim(), baseUrl).toString();
  } catch {
    return null;
  }
}

async function fetchAmazonPage(
  startUrl: string,
  maxHops = 10
): Promise<{ url: string; html: string }> {
  let current = startUrl.trim();

  for (let hop = 0; hop < maxHops; hop++) {
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: BROWSER_HEADERS,
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) break;
      current = new URL(location, current).toString();
      continue;
    }

    const html = await response.text();
    const finalUrl = response.url || current;

    const asinFromUrl = extractAsinFromResolvedUrl(finalUrl);
    if (asinFromUrl) {
      return { url: finalUrl, html };
    }

    const metaRefreshUrl = extractMetaRefreshUrl(html, finalUrl);
    if (metaRefreshUrl && metaRefreshUrl !== current) {
      current = metaRefreshUrl;
      continue;
    }

    return { url: finalUrl, html };
  }

  return { url: current, html: "" };
}

export type ResolvedAmazonProduct = {
  resolvedUrl: string;
  asin: string | null;
};

export async function resolveAmazonProductUrl(url: string): Promise<ResolvedAmazonProduct> {
  const trimmed = url.trim();
  const directAsin = extractAsinFromResolvedUrl(trimmed);
  if (directAsin) {
    return { resolvedUrl: trimmed, asin: directAsin };
  }

  const host = normalizeHostname(new URL(trimmed).hostname);
  const needsFetch = isAmazonShortHost(host) || !directAsin;

  if (!needsFetch) {
    return { resolvedUrl: trimmed, asin: null };
  }

  const { url: fetchedUrl, html } = await fetchAmazonPage(trimmed);

  const asinFromFetchedUrl = extractAsinFromResolvedUrl(fetchedUrl);
  if (asinFromFetchedUrl) {
    return { resolvedUrl: fetchedUrl, asin: asinFromFetchedUrl };
  }

  const asinFromHtml = html ? extractAsinFromHtml(html) : null;
  if (asinFromHtml) {
    const resolvedUrl = fetchedUrl.includes("/dp/")
      ? fetchedUrl
      : `https://www.amazon.com/dp/${asinFromHtml}`;
    return { resolvedUrl, asin: asinFromHtml };
  }

  return { resolvedUrl: fetchedUrl, asin: null };
}

/** @deprecated Use resolveAmazonProductUrl */
export async function resolveAmazonUrl(url: string): Promise<string> {
  const { resolvedUrl } = await resolveAmazonProductUrl(url);
  return resolvedUrl;
}