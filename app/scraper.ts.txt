/**
 * Public scraper for occhialematto.com — reads /products.json endpoint
 * No authentication needed. Works on any Shopify store.
 *
 * Shopify exposes /products.json by default on every storefront.
 * Returns up to 250 products per page. Paginated with ?page=N.
 *
 * Response shape (per product):
 * {
 *   id, title, handle, body_html, vendor, product_type,
 *   created_at, updated_at, published_at, tags (string),
 *   variants: [{ id, title, price, available, compare_at_price, ... }],
 *   images: [{ id, src, alt, position, ... }]
 * }
 */

const STORE_URL = "https://www.occhialematto.com";

export type ScrapedProduct = {
  id: string;
  handle: string;
  title: string;
  price: number;
  comparePrice: number | null;
  currency: string;
  imageUrl: string | null;
  url: string;
  tags: string[];
  available: boolean;
  productType: string;
  createdAt: string;
  publishedAt: string;
};

/**
 * Fetch all products from the public storefront.
 * Paginates automatically up to 5 pages (1250 products) — more than enough.
 */
export async function scrapeAllProducts(): Promise<ScrapedProduct[]> {
  const all: ScrapedProduct[] = [];

  for (let page = 1; page <= 5; page++) {
    const url = `${STORE_URL}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "OcchialeMattoPlatform/1.0" },
      cache: "no-store",
      // Next.js revalidation — refetch at most every 10 minutes
      next: { revalidate: 600 }
    });

    if (!res.ok) {
      console.error(`[scraper] page ${page} failed:`, res.status);
      break;
    }

    const json: any = await res.json();
    const products = json?.products || [];
    if (products.length === 0) break;

    for (const p of products) {
      const firstVariant = p.variants?.[0];
      const firstImage = p.images?.[0];

      all.push({
        id: String(p.id),
        handle: p.handle,
        title: p.title,
        price: parseFloat(firstVariant?.price || "0"),
        comparePrice: firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
        currency: "EUR",
        imageUrl: firstImage?.src || null,
        url: `${STORE_URL}/products/${p.handle}`,
        tags: (p.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean),
        available: (p.variants || []).some((v: any) => v.available),
        productType: p.product_type || "",
        createdAt: p.created_at || "",
        publishedAt: p.published_at || ""
      });
    }

    // If we got fewer than 250, we've reached the last page
    if (products.length < 250) break;
  }

  return all;
}

/**
 * Fetch a single product by handle (e.g. "cardie", "destino").
 * Useful for quick lookups without scraping the whole catalog.
 */
export async function scrapeProduct(handle: string): Promise<ScrapedProduct | null> {
  const url = `${STORE_URL}/products/${handle}.json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "OcchialeMattoPlatform/1.0" },
    cache: "no-store",
    next: { revalidate: 300 }
  });

  if (!res.ok) return null;
  const json: any = await res.json();
  const p = json?.product;
  if (!p) return null;

  const firstVariant = p.variants?.[0];
  const firstImage = p.images?.[0];

  return {
    id: String(p.id),
    handle: p.handle,
    title: p.title,
    price: parseFloat(firstVariant?.price || "0"),
    comparePrice: firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
    currency: "EUR",
    imageUrl: firstImage?.src || null,
    url: `${STORE_URL}/products/${p.handle}`,
    tags: (p.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean),
    available: (p.variants || []).some((v: any) => v.available),
    productType: p.product_type || "",
    createdAt: p.created_at || "",
    publishedAt: p.published_at || ""
  };
}
