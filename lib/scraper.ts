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

/**
 * Sceglie l'immagine PRODOTTO pulita, scartando le foto lifestyle/modello.
 * Su questo store le foto del modello che indossa l'occhiale si riconoscono da:
 *   - alt text che contiene "cover", OPPURE
 *   - filename che inizia con "hf_" (render generati) o contiene "cover".
 * Le foto prodotto pulite hanno filename tipo Progettosenzatitolo…, DSC…, IMG_…, …PRODOTTO.
 * Strategia: scorri TUTTE le immagini e prendi la prima "pulita".
 * Fallback: se sono tutte sporche o senza src, usa la prima disponibile.
 */
function pickProductImage(images: any[]): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;

  const filenameOf = (src: string) => {
    try {
      const path = String(src).split("?")[0];
      return path.substring(path.lastIndexOf("/") + 1).toLowerCase();
    } catch { return ""; }
  };
  const isDirty = (img: any) => {
    const alt = String(img?.alt || "").toLowerCase();
    const fname = filenameOf(img?.src || "");
    return alt.includes("cover") || /^hf_/.test(fname) || fname.includes("cover");
  };

  const clean = images.find(img => img?.src && !isDirty(img));
  if (clean?.src) return clean.src;
  // fallback: prima immagine con src (meglio una foto che nessuna)
  const anyImg = images.find(img => img?.src);
  return anyImg?.src || null;
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

      all.push({
        id: String(p.id),
        handle: p.handle,
        title: p.title,
        price: parseFloat(firstVariant?.price || "0"),
        comparePrice: firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
        currency: "EUR",
        imageUrl: pickProductImage(p.images),
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

  return {
    id: String(p.id),
    handle: p.handle,
    title: p.title,
    price: parseFloat(firstVariant?.price || "0"),
    comparePrice: firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
    currency: "EUR",
    imageUrl: pickProductImage(p.images),
    url: `${STORE_URL}/products/${p.handle}`,
    tags: normalizeTags(p.tags),
    available: (p.variants || []).some((v: any) => v.available),
    productType: p.product_type || "",
    createdAt: p.created_at || "",
    publishedAt: p.published_at || ""
  };
}
