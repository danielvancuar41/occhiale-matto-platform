import { NextResponse } from "next/server";
import { scrapeAllProducts } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 30;
export const revalidate = 600;

export async function GET() {
  try {
    const scraped = await scrapeAllProducts();

    const NEW_THRESHOLD_DAYS = 90;
    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;

    const products = scraped
      .filter(p => p.available && p.imageUrl && p.price > 0)
      .map(p => {
        const createdMs = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        const daysOld = createdMs ? (now - createdMs) / msPerDay : 999;
        const isNew = daysOld < NEW_THRESHOLD_DAYS;

        const tagsLower = p.tags.map(t => t.toLowerCase());
        let category = "uomo";
        if (tagsLower.some(t => t.includes("donna") || t.includes("woman"))) category = "donna";
        else if (tagsLower.some(t => t.includes("premium") || t.includes("acetato"))) category = "premium";
        else if (isNew) category = "novita2026";

        return {
          id: p.handle,
          name: p.title,
          price: p.price,
          category,
          url: p.url,
          img: p.imageUrl,
          new: isNew,
          tags: p.tags,
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
