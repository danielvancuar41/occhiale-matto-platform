/**
 * Public scraper for occhialematto.com — reads /products.json endpoint
 */

const STORE_URL = "https://www.occhialematto.com";

export type ScrapedProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  price: number;
  comparePrice: number | null;
  currency: string;
  imageUrl: string | null;
  url: string;
  tags: string[];
  colors: string[];     // valori dell'opzione "Colore" delle varianti disponibili
  description: string;  // body_html ripulito (su questo store di solito sono le misure)
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

/** HTML della scheda prodotto → testo semplice su una riga. */
function htmlToText(html: string): string {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Colori delle varianti disponibili (opzione "Colore"/"Color"), senza doppioni. */
function pickColors(p: any): string[] {
  const options: any[] = Array.isArray(p.options) ? p.options : [];
  const idx = options.findIndex(o => /^(colore|color|colour)$/i.test(String(o?.name || "").trim()));
  if (idx === -1) return [];
  const key = `option${idx + 1}`;
  const values = (p.variants || [])
    .filter((v: any) => v.available)
    .map((v: any) => String(v[key] || "").trim())
    .filter(Boolean);
  return Array.from(new Set<string>(values));
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

function toScraped(p: any): ScrapedProduct {
  const firstVariant = p.variants?.[0];
  return {
    id: String(p.id),
    handle: p.handle,
    title: p.title,
    vendor: p.vendor || "",
    price: parseFloat(firstVariant?.price || "0"),
    comparePrice: firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
    currency: "EUR",
    imageUrl: pickProductImage(p.images),
    url: `${STORE_URL}/products/${p.handle}`,
    tags: normalizeTags(p.tags),
    colors: pickColors(p),
    description: htmlToText(p.body_html),
    available: (p.variants || []).some((v: any) => v.available),
    productType: p.product_type || "",
    createdAt: p.created_at || "",
    publishedAt: p.published_at || ""
  };
}

export async function scrapeAllProducts(): Promise<ScrapedProduct[]> {
  const all: ScrapedProduct[] = [];

  for (let page = 1; page <= 5; page++) {
    const url = `${STORE_URL}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "OcchialeMattoPlatform/1.0" },
      cache: "no-store"
    });

    if (!res.ok) {
      // Se fallisce già la prima pagina il catalogo è inutilizzabile: meglio un errore chiaro.
      if (page === 1) throw new Error(`occhialematto.com ha risposto ${res.status}`);
      console.error(`[scraper] page ${page} failed:`, res.status);
      break;
    }

    const json: any = await res.json();
    const products = json?.products || [];
    if (products.length === 0) break;

    for (const p of products) all.push(toScraped(p));

    if (products.length < 250) break;
  }

  return all;
}

export async function scrapeProduct(handle: string): Promise<ScrapedProduct | null> {
  const url = `${STORE_URL}/products/${handle}.json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "OcchialeMattoPlatform/1.0" },
    cache: "no-store"
  });

  if (!res.ok) return null;
  const json: any = await res.json();
  const p = json?.product;
  if (!p) return null;
  return toScraped(p);
}
