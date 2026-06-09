import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/debug-env
 * Returns which env vars are visible to the server.
 * Returns only TRUE/FALSE — never the actual values.
 * Safe to call publicly because no secrets are leaked.
 */
export async function GET() {
  const env = process.env;

  const report = {
    timestamp: new Date().toISOString(),
    runtime: "nodejs (server)",
    vercel_env: env.VERCEL_ENV || "(not set)",
    vercel_region: env.VERCEL_REGION || "(not set)",
    deployment_url: env.VERCEL_URL || "(not set)",

    // Each var: { present: boolean, length: number, preview: first 4 chars + "..." }
    vars: {
      NEXT_PUBLIC_SUPABASE_URL: describe(env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: describe(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: describe(env.SUPABASE_SERVICE_ROLE_KEY),
      ANTHROPIC_API_KEY: describe(env.ANTHROPIC_API_KEY),
      KLAVIYO_API_KEY: describe(env.KLAVIYO_API_KEY),
      KLAVIYO_CONVERSION_METRIC_ID: describe(env.KLAVIYO_CONVERSION_METRIC_ID),
    },

    // List all env vars that start with SUPABASE_ or NEXT_PUBLIC_SUPABASE
    // (helps detect typos like SUPABASE → SUPABASE)
    all_supabase_keys: Object.keys(env)
      .filter(k => k.toUpperCase().includes("SUPABASE") || k.toUpperCase().includes("SUPABASE"))
      .sort()
  };

  return NextResponse.json(report);
}

function describe(v: string | undefined) {
  if (v === undefined) return { present: false };
  if (v === "") return { present: true, empty: true };
  return {
    present: true,
    length: v.length,
    preview: v.length > 8 ? v.slice(0, 4) + "..." + v.slice(-2) : "(short)"
  };
}
