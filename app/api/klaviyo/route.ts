import { NextRequest, NextResponse } from "next/server";
import { listCampaigns, getCampaignStats } from "@/lib/klaviyo";
import { parseKlaviyoCsv } from "@/lib/csv";
import type { Campaign } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/klaviyo/campaigns
 * Returns enriched campaign list from Klaviyo API (if key set).
 */
export async function GET() {
  if (!process.env.KLAVIYO_API_KEY) {
    return NextResponse.json(
      { error: "KLAVIYO_API_KEY not set. Use POST with CSV upload as fallback." },
      { status: 501 }
    );
  }

  try {
    const campaigns = await listCampaigns(50);
    const enriched = await Promise.all(
      campaigns.map(async (c) => {
        const stats = await getCampaignStats(c.id);
        return {
          name: c.name,
          subject: c.subject,
          sendDate: (c.sendTime || "").split("T")[0],
          weekday: new Date(c.sendTime || Date.now()).toLocaleDateString("en-US", { weekday: "long" }),
          recipients: stats?.recipients || 0,
          opens: stats?.opens || 0,
          openRate: stats?.openRate || 0,
          clicks: stats?.clicks || 0,
          clickRate: stats?.clickRate || 0,
          orders: stats?.placedOrders || 0,
          revenue: stats?.revenue || 0,
          unsubscribes: stats?.unsubscribes || 0
        } satisfies Campaign;
      })
    );
    return NextResponse.json({ ok: true, campaigns: enriched });
  } catch (err: any) {
    console.error("[klaviyo] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/klaviyo/campaigns
 * Accepts CSV upload body (text/csv) and returns parsed campaigns.
 * Use this when Klaviyo API key is not configured yet.
 */
export async function POST(req: NextRequest) {
  try {
    const csv = await req.text();
    if (!csv || csv.length < 50) {
      return NextResponse.json({ error: "Empty or invalid CSV" }, { status: 400 });
    }
    const campaigns = parseKlaviyoCsv(csv);
    return NextResponse.json({ ok: true, campaigns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
