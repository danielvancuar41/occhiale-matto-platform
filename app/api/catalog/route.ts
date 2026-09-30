import { NextResponse } from "next/server";
import { scrapeAllProducts, type ScrapedProduct } from "@/lib/scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const NEW_THRESHOLD_DAYS = 90;

// Prodotti dello store che non sono occhiali (accessori, servizi lenti, gift card, appuntamenti).
const NOT_EYEWEAR = /gift|catenin|cacciavit|lenti-graduate|secure-card|appointment|controllo della vista|supplement|antiriflesso|lavorazione|pacchett|custodi|panno/i;

// Tag Shopify → caratteristica leggibile da passare a Claude (solo tag con significato certo).
const TAG_FEATURES: Record<string, string> = {
  cerchiato: "montatura cerchiata",
  metallo: "montatura in metallo",
  glasant: "montatura glasant",
  nylor: "montatura nylor",
  fotocromatico: "lenti fotocromatiche",
  iconici: "collezione Iconici",
  omsport: "linea sport"
};

function isEyewear(p: ScrapedProduct): boolean {
  return !NOT_EYEWEAR.test(`${p.handle} ${p.title} ${p.vendor}`);
}

/** Genere dai tag: i modelli con sia "Donna" che "Uomo" sono unisex. */
function genderOf(tagsLower: string[]): string {
  const donna = tagsLower.includes("donna");
  const uomo = tagsLower.includes("uomo");
  if (tagsLower.includes("unisex") || (donna && uomo)) return "unisex";
  if (donna) return "donna";
  if (uomo) return "uomo";
  return "";
}

function featuresOf(p: ScrapedProduct, tagsLower: string[]): string[] {
  const out = tagsLower.map(t => TAG_FEATURES[t]).filter(Boolean);
  if (/acetato/i.test(p.title)) out.push("montatura in acetato");
  // Senza tag ma con una variante colore fotocromatica: non vale per tutto il modello
  if (!out.includes("lenti fotocromatiche") && p.colors.some(c => /fotocromat/i.test(c))) {
    out.push("disponibile anche con lenti fotocromatiche");
  }
  return Array.from(new Set(out));
}

/** Solo le misure della scheda ("Asta: 145mm", "Ponte: 21"…), senza il testo promozionale. */
function measuresOf(description: string): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const m of Array.from(description.matchAll(/\b(asta|montatura|ponte|lente)\s*:\s*(\d+(?:[.,]\d+)?)/gi))) {
    const label = m[1].toLowerCase();
    if (seen.has(label)) continue;
    seen.add(label);
    parts.push(`${label[0].toUpperCase()}${label.slice(1)} ${m[2]} mm`);
  }
  return parts.join(", ");
}

export async function GET() {
  try {
    const scraped = await scrapeAllProducts();
    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;

    const products = scraped
      .filter(p => p.available && p.imageUrl && p.price > 0 && isEyewear(p))
      .map(p => {
        const createdMs = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        const daysOld = createdMs ? (now - createdMs) / msPerDay : 999;
        const tagsLower = p.tags.map(t => t.toLowerCase());

        return {
          id: p.handle,
          name: p.title,
          price: p.price,
          category: genderOf(tagsLower),
          url: p.url,
          img: p.imageUrl,
          imgW: p.imageWidth,
          imgH: p.imageHeight,
          new: daysOld < NEW_THRESHOLD_DAYS,
          tags: p.tags,
          features: featuresOf(p, tagsLower),
          colors: p.colors,
          details: measuresOf(p.description),
          available: p.available
        };
      });

    return NextResponse.json({
      ok: true,
      count: products.length,
      products,
      source: "scraper",
      fetchedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[catalog] scraper error:", err);
    return NextResponse.json(
      { error: err.message || "Scraper failed", ok: false, products: [] },
      { status: 500 }
    );
  }
}
