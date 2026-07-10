import { NextResponse } from "next/server";
import { fetchEnrichedCampaigns, getLastStatsError } from "@/lib/klaviyo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitRaw || "50", 10) || 50, 1), 200);

    const campaigns = await fetchEnrichedCampaigns(limit);
    const statsError = getLastStatsError();

    return NextResponse.json({
      ok: true,
      count: campaigns.length,
      campaigns,
      fetchedAt: new Date().toISOString(),
      statsError: statsError || undefined,
      hasStats: campaigns.some(c => c.recipients > 0 || c.opens > 0)
    });
  } catch (err: any) {
    console.error("[/api/klaviyo] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error", campaigns: [] },
      { status: 500 }
    );
  }
}
