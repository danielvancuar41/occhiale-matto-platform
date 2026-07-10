import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/keep-alive
 *
 * Called by Vercel cron once a day to keep the Supabase Free tier project active.
 * Supabase Free auto-pauses projects after 7 days of inactivity, so a small daily
 * query keeps it running indefinitely.
 *
 * Also safe to call manually anytime.
 */
export async function GET() {
  const startTime = Date.now();

  try {
    const supabase = getAdminClient();
    const { count, error } = await supabase
      .from("adv_weeks")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    const elapsed = Date.now() - startTime;
    console.log(`[keep-alive] ping ok, ${count} weeks, ${elapsed}ms`);

    return NextResponse.json({
      ok: true,
      pingedAt: new Date().toISOString(),
      elapsedMs: elapsed,
      weeksCount: count || 0
    });
  } catch (err: any) {
    console.error("[keep-alive] failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
