/**
 * Public scraper for occhialematto.com — reads /products.json endpoint
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

function normalizeTags(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(t => String(t).trim()).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map(t => t.trim()).filter(Boolean);
  return [];
}

export async function scrapeAllProducts(): Promise<ScrapedProduct[]> {
  const all: ScrapedProduct[] = [];

  for (let page = 1; page <= 5; page++) {
    const url = `${STORE_URL}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "OcchialeMattoPlatform/1.0" },
      cache: "no-store",
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
        tags: normalizeTags(p.tags),
        available: (p.variants || []).some((v: any) => v.available),
        productType: p.product_type || "",
        createdAt: p.created_at || "",
        publishedAt: p.published_at || ""
      });
    }

    if (products.length < 250) break;
  }

  return all;
}

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
    tags: normalizeTags(p.tags),
    available: (p.variants || []).some((v: any) => v.available),
    productType: p.product_type || "",
    createdAt: p.created_at || "",
    publishedAt: p.published_at || ""
  };
}
