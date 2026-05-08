import { NextResponse } from "next/server";
import { fetchEnrichedCampaigns } from "@/lib/klaviyo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const revalidate = 0;

/**
 * GET /api/klaviyo
 * Returns the last 75 enriched campaigns from Klaviyo.
 * Accepts ?limit=N to override (max 100).
 *
 * Cached server-side via Vercel for 1 hour by default,
 * but the client uses a manual refresh button (force=1 to bypass).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "75", 10), 100);

  try {
    const campaigns = await fetchEnrichedCampaigns(limit);
    return NextResponse.json({
      ok: true,
      count: campaigns.length,
      campaigns,
      fetchedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[api/klaviyo] error:", err);
    return NextResponse.json(
      {
        error: err.message || "Klaviyo fetch failed",
        ok: false,
        campaigns: []
      },
      { status: 500 }
    );
  }
}
