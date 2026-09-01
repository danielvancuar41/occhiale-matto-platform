import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/debug-env?key=XXXX
 * Returns which env vars are visible to the server.
 * Returns only TRUE/FALSE + preview — never the actual values.
 *
 * PROTETTO: richiede ?key= uguale a DEBUG_ENV_TOKEN (env var su Vercel).
 * Se DEBUG_ENV_TOKEN non è settato, l'endpoint è disabilitato (404),
 * così non resta mai pubblico per sbaglio in produzione.
 */
export async function GET(req: Request) {
  const token = process.env.DEBUG_ENV_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("key") !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    // Tutte le env che contengono "SUPABASE" (utile per scovare typo nei nomi)
    all_supabase_keys: Object.keys(env)
      .filter(k => k.toUpperCase().includes("SUPABASE"))
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
