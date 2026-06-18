const AMAZON_MARKETPLACE_HOST =
  /^amazon\.(com|co\.uk|de|fr|ca|co\.jp|in|com\.au|com\.mx|it|es|nl|se|pl|com\.br|ae|sa|sg|com\.tr)$/i;

const AMAZON_SHORT_HOSTS = new Set(["a.co", "amzn.to", "amzn.com"]);

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

export async function resolveAmazonUrl(url: string): Promise<string> {
  const trimmed = url.trim();

  try {
    const host = normalizeHostname(new URL(trimmed).hostname);
    if (!isAmazonShortHost(host)) {
      return trimmed;
    }

    const response = await fetch(trimmed, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    return response.url || trimmed;
  } catch {
    return trimmed;
  }
}