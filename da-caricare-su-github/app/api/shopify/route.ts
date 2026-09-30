import { NextResponse } from "next/server";
import { listAllProducts } from "@/lib/shopify";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  if (!process.env.SHOPIFY_STOREFRONT_TOKEN || !process.env.SHOPIFY_STORE_DOMAIN) {
    return NextResponse.json(
      { error: "Shopify env vars not set (SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_TOKEN)" },
      { status: 501 }
    );
  }

  try {
    const products = await listAllProducts();
    return NextResponse.json({ ok: true, count: products.length, products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
