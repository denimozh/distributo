// src/app/api/scraper/product/route.js
// Product URL Scraper
// Extracts product info from Shopify, Amazon, TikTok Shop, and generic sites

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const result = await scrapeProductFromUrl(url);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Scraper] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ===========================================
// MAIN SCRAPER
// ===========================================

async function scrapeProductFromUrl(url) {
  try {
    // Validate URL
    const parsedUrl = new URL(url);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Detect platform and use appropriate scraper
    if (isShopify(html, parsedUrl)) {
      return scrapeShopify(html, url);
    }

    if (parsedUrl.hostname.includes("amazon.")) {
      return scrapeAmazon(html, url);
    }

    if (parsedUrl.hostname.includes("tiktok.com")) {
      return scrapeTikTokShop(html, url);
    }

    // Generic scraping
    return scrapeGeneric(html, url);

  } catch (error) {
    console.error("[Scraper] Scrape failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ===========================================
// PLATFORM DETECTION
// ===========================================

function isShopify(html, parsedUrl) {
  return (
    html.includes("Shopify.shop") ||
    html.includes("cdn.shopify.com") ||
    html.includes("shopify-section") ||
    parsedUrl.hostname.includes("myshopify.com")
  );
}

// ===========================================
// SHOPIFY SCRAPER
// ===========================================

function scrapeShopify(html, url) {
  // Try JSON-LD first (most reliable)
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);

  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script type="application\/ld\+json">/, "").replace(/<\/script>/, "");
        const data = JSON.parse(jsonContent);

        if (data["@type"] === "Product" || data.offers) {
          return {
            success: true,
            source: "shopify",
            name: data.name,
            description: cleanDescription(data.description),
            price: data.offers?.price || data.offers?.[0]?.price,
            currency: data.offers?.priceCurrency || data.offers?.[0]?.priceCurrency || "USD",
            images: extractImages(data.image),
            brand: data.brand?.name,
            url,
          };
        }
      } catch (e) {
        // Continue to next match
      }
    }
  }

  // Fallback to meta tags
  return scrapeGeneric(html, url, "shopify");
}

// ===========================================
// AMAZON SCRAPER
// ===========================================

function scrapeAmazon(html, url) {
  const name = extractMeta(html, "og:title") || extractBetween(html, '<span id="productTitle"', '</span>');
  const description = extractMeta(html, "og:description") || extractById(html, "productDescription");
  const image = extractMeta(html, "og:image");
  const priceMatch = html.match(/\$[\d,]+\.?\d*/);

  return {
    success: true,
    source: "amazon",
    name: cleanText(name),
    description: cleanDescription(description),
    price: priceMatch ? priceMatch[0].replace("$", "").replace(",", "") : null,
    currency: "USD",
    images: image ? [image] : [],
    url,
  };
}

// ===========================================
// TIKTOK SHOP SCRAPER
// ===========================================

function scrapeTikTokShop(html, url) {
  // TikTok Shop uses React hydration, so we look for __INITIAL_STATE__
  const stateMatch = html.match(/<script[^>]*>window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})<\/script>/);

  if (stateMatch) {
    try {
      const state = JSON.parse(stateMatch[1]);
      const product = state?.product?.productInfo || state?.productInfo;

      if (product) {
        return {
          success: true,
          source: "tiktok_shop",
          name: product.title,
          description: product.description,
          price: product.price?.value || product.salePrice?.value,
          currency: product.price?.currency || "USD",
          images: product.images?.map(img => img.url) || [],
          url,
        };
      }
    } catch (e) {
      // Fall through to generic
    }
  }

  return scrapeGeneric(html, url, "tiktok_shop");
}

// ===========================================
// GENERIC SCRAPER
// ===========================================

function scrapeGeneric(html, url, detectedSource = "generic") {
  // Extract from Open Graph and standard meta tags
  const name = extractMeta(html, "og:title") ||
    extractMeta(html, "title") ||
    extractTag(html, "title");

  const description = extractMeta(html, "og:description") ||
    extractMeta(html, "description");

  const image = extractMeta(html, "og:image") ||
    extractMeta(html, "twitter:image");

  const price = extractMeta(html, "product:price:amount") ||
    extractMeta(html, "og:price:amount");

  const currency = extractMeta(html, "product:price:currency") ||
    extractMeta(html, "og:price:currency") ||
    "USD";

  // Look for additional images
  const images = [];
  if (image) images.push(image);

  // Try to find more product images
  const imgMatches = html.matchAll(/<img[^>]*src="([^"]*)"[^>]*>/g);
  for (const match of imgMatches) {
    const src = match[1];
    if (
      src.includes("product") ||
      src.includes("cdn") ||
      src.includes("image")
    ) {
      if (!images.includes(src) && isValidImageUrl(src)) {
        images.push(src);
        if (images.length >= 5) break;
      }
    }
  }

  return {
    success: true,
    source: detectedSource,
    name: cleanText(name),
    description: cleanDescription(description),
    price: price ? parseFloat(price) : null,
    currency,
    images: images.slice(0, 5),
    url,
  };
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function extractMeta(html, name) {
  // Try property first (Open Graph)
  let match = html.match(new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"));
  if (match) return match[1];

  // Try name (standard meta)
  match = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"));
  if (match) return match[1];

  // Try reversed order
  match = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, "i"));
  return match ? match[1] : null;
}

function extractTag(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, "i"));
  return match ? match[1] : null;
}

function extractById(html, id) {
  const match = html.match(new RegExp(`id=["']${id}["'][^>]*>([\\s\\S]*?)</`, "i"));
  return match ? match[1] : null;
}

function extractBetween(html, start, end) {
  const startIndex = html.indexOf(start);
  if (startIndex === -1) return null;

  const endIndex = html.indexOf(end, startIndex);
  if (endIndex === -1) return null;

  const content = html.substring(startIndex + start.length, endIndex);
  // Remove any remaining HTML tags
  return content.replace(/<[^>]*>/g, "").trim();
}

function extractImages(imageData) {
  if (!imageData) return [];
  if (typeof imageData === "string") return [imageData];
  if (Array.isArray(imageData)) {
    return imageData.map(img => typeof img === "string" ? img : img.url || img.contentUrl).filter(Boolean);
  }
  if (imageData.url) return [imageData.url];
  return [];
}

function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDescription(text) {
  if (!text) return "";
  let cleaned = cleanText(text);

  // Truncate to reasonable length
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 497) + "...";
  }

  return cleaned;
}

function isValidImageUrl(url) {
  if (!url) return false;
  if (url.startsWith("data:")) return false;
  if (url.includes("placeholder")) return false;
  if (url.includes("spacer")) return false;
  if (url.includes("pixel")) return false;
  if (url.includes("loading")) return false;

  // Check for image extensions
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const hasImageExtension = imageExtensions.some(ext =>
    url.toLowerCase().includes(ext)
  );

  return hasImageExtension || url.includes("image") || url.includes("cdn");
}
