/**
 * Klaviyo Campaigns Loader v4
 *
 * Critical fix for Vercel 60s timeout:
 * - Stats fetched ONLY for the most recent 50 campaigns
 * - 2 batches of 25 max (vs 4 batches of 20)
 * - Shorter retry waits (2 retries max)
 * - Hard time budget: stops fetching stats after 40s elapsed
 */

const KLAVIYO_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";

// Only fetch stats for the most recent N campaigns (the rest get zeros)
const STATS_LIMIT = 50;
const BATCH_SIZE = 25;
const PAUSE_MS = 1500;
const MAX_RETRIES = 2;
const TIME_BUDGET_MS = 40000; // 40s — leave 20s headroom under Vercel's 60s limit

export type EnrichedCampaign = {
  id: string;
  name: string;
  date: string;
  subject: string;
  preview?: string;
  recipients: number;
  delivered: number;
  opens: number;
  or: number;
  clicks: number;
  cr: number;
  orders: number;
  rev: number;
  unsub: number;
  type: CampaignType;
  html?: boolean;
};

export type CampaignType =
  | "drop"
  | "multi"
  | "categoria"
  | "community"
  | "promo"
  | "brand"
  | "stagionale";

let _lastStatsError: string | null = null;
export function getLastStatsError() { return _lastStatsError; }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function inferType(subject: string, name: string): CampaignType {
  const s = (subject + " " + name).toLowerCase();
  if (/promo|sconto|3x2|saldi|offerta|black/.test(s)) return "promo";
  if (/grazie|buone feste|natale|capodanno|community|dicono|preferiti/.test(s)) return "community";
  if (/pasqua|primavera|estate|inverno|stagione/.test(s)) return "stagionale";
  if (/è arrivato|arrivati|nuovo|drop/.test(s)) return "drop";
  if (/vs |\bvs\b|nuovi|loro|tutti/.test(s)) return "multi";
  if (/fotocromat|categoria|ottica|sole/.test(s)) return "categoria";
  return "brand";
}

async function klaviyoFetch(path: string): Promise<any> {
  const apiKey = process.env.KLAVIYO_API_KEY;
  if (!apiKey) throw new Error("KLAVIYO_API_KEY not configured");

  const url = `${KLAVIYO_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Authorization": `Klaviyo-API-Key ${apiKey}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "revision": KLAVIYO_REVISION
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Klaviyo ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function listCampaigns(maxItems = 75): Promise<any[]> {
  const filter = `filter=${encodeURIComponent('equals(messages.channel,"email")')}`;
  const sort = "sort=-scheduled_at";
  const include = "include=campaign-messages";

  const all: any[] = [];
  let path: string | null = `/campaigns/?${filter}&${sort}&${include}`;
  let included: any[] = [];

  while (path && all.length < maxItems) {
    const data: any = await klaviyoFetch(path);
    if (Array.isArray(data?.data)) all.push(...data.data);
    if (Array.isArray(data?.included)) included.push(...data.included);
    const next = data?.links?.next;
    if (!next) break;
    path = next.replace(KLAVIYO_BASE, "");
  }

  if (all.length === 0) {
    let fallbackPath: string | null = `/campaigns/?${sort}&${include}`;
    while (fallbackPath && all.length < maxItems) {
      const data: any = await klaviyoFetch(fallbackPath);
      if (Array.isArray(data?.data)) all.push(...data.data);
      if (Array.isArray(data?.included)) included.push(...data.included);
      const next = data?.links?.next;
      if (!next) break;
      fallbackPath = next.replace(KLAVIYO_BASE, "");
    }
  }

  for (const c of all) {
    const msgIds = c?.relationships?.["campaign-messages"]?.data?.map((m: any) => m.id) || [];
    c._messages = msgIds.map((id: string) =>
      included.find((i: any) => i.type === "campaign-message" && i.id === id)
    ).filter(Boolean);
  }

  console.log("[klaviyo] listCampaigns done:", all.length);
  return all.slice(0, maxItems);
}

async function reportsCallWithRetry(
  body: any,
  attempt = 1
): Promise<{ ok: boolean; status: number; json?: any; errorText?: string }> {
  const apiKey = process.env.KLAVIYO_API_KEY;

  const res = await fetch(`${KLAVIYO_BASE}/campaign-values-reports/`, {
    method: "POST",
    headers: {
      "Authorization": `Klaviyo-API-Key ${apiKey}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "revision": KLAVIYO_REVISION
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (res.ok) return { ok: true, status: res.status, json: await res.json() };

  const text = await res.text();

  if (res.status === 429 && attempt <= MAX_RETRIES) {
    let waitSec = 2 * attempt;
    const m = text.match(/Expected available in (\d+(?:\.\d+)?) second/);
    if (m) waitSec = Math.max(parseFloat(m[1]) + 0.5, waitSec);
    const waitMs = Math.ceil(waitSec * 1000);
    console.warn(`[klaviyo] 429 retry ${attempt}/${MAX_RETRIES}, waiting ${waitMs}ms`);
    await sleep(waitMs);
    return reportsCallWithRetry(body, attempt + 1);
  }

  return { ok: false, status: res.status, errorText: text };
}

async function getStatsForCampaigns(campaignIds: string[]): Promise<Record<string, any>> {
  if (!campaignIds.length) return {};

  const conversionMetricId = process.env.KLAVIYO_CONVERSION_METRIC_ID;
  const idsList = campaignIds.map(id => `"${id}"`).join(",");

  const body: any = {
    data: {
      type: "campaign-values-report",
      attributes: {
        statistics: [
          "recipients", "delivered", "opens_unique", "clicks_unique",
          "bounced", "unsubscribes", "open_rate", "click_rate",
          "conversions", "conversion_value"
        ],
        timeframe: { key: "last_365_days" },
        filter: `any(campaign_id,[${idsList}])`
      }
    }
  };

  if (conversionMetricId) {
    body.data.attributes.conversion_metric_id = conversionMetricId;
  }

  const result = await reportsCallWithRetry(body);

  if (!result.ok) {
    const err = `Reports ${result.status}: ${result.errorText?.slice(0, 300)}`;
    console.error(`[klaviyo] ${err}`);
    _lastStatsError = err;
    return {};
  }

  const json = result.json;
  const attrs = json?.data?.attributes || {};
  const rows: any[] =
    attrs.results ||
    attrs.data ||
    json?.data?.results ||
    [];

  if (rows.length > 0) {
    console.log("[klaviyo] Reports row sample keys:", Object.keys(rows[0] || {}));
  }

  const map: Record<string, any> = {};
  for (const row of rows) {
    const cid =
      row?.groupings?.campaign_id ||
      row?.campaign_id ||
      row?.id ||
      row?.dimensions?.[0];
    if (cid) {
      map[cid] = row.statistics || row.values || row || {};
    }
  }

  return map;
}

export async function fetchEnrichedCampaigns(maxItems = 75): Promise<EnrichedCampaign[]> {
  _lastStatsError = null;
  const startTime = Date.now();

  const campaigns = await listCampaigns(maxItems);
  if (!campaigns.length) return [];

  // Stats only for the most recent N (which are sorted first since sort=-scheduled_at)
  const idsForStats = campaigns.slice(0, STATS_LIMIT).map(c => c.id);
  const statsMap: Record<string, any> = {};

  for (let i = 0; i < idsForStats.length; i += BATCH_SIZE) {
    // Time budget guard: stop if we've used too much time
    const elapsed = Date.now() - startTime;
    if (elapsed > TIME_BUDGET_MS) {
      console.warn(`[klaviyo] time budget exhausted (${elapsed}ms), stopping stats fetch`);
      _lastStatsError = `Time budget exhausted after ${elapsed}ms. Got stats for ${Object.keys(statsMap).length}/${idsForStats.length} campaigns.`;
      break;
    }

    const batch = idsForStats.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const map = await getStatsForCampaigns(batch);
      Object.assign(statsMap, map);
      console.log(`[klaviyo] batch ${batchNum}: mapped ${Object.keys(map).length}, total ${Object.keys(statsMap).length}`);
    } catch (err: any) {
      console.error(`[klaviyo] batch ${batchNum} failed:`, err?.message);
      _lastStatsError = err?.message || String(err);
    }

    if (i + BATCH_SIZE < idsForStats.length) {
      await sleep(PAUSE_MS);
    }
  }

  const totalElapsed = Date.now() - startTime;
  console.log(`[klaviyo] done in ${totalElapsed}ms, stats for ${Object.keys(statsMap).length}/${idsForStats.length}`);

  return campaigns.map((c): EnrichedCampaign => {
    const attrs = c.attributes || {};
    const sentAt: string = attrs.send_time || attrs.scheduled_at || attrs.created_at || "";
    const date = sentAt ? sentAt.slice(0, 10) : "";

    const firstMsg = c._messages?.[0];
    const msgAttrs = firstMsg?.attributes || {};
    const def = msgAttrs.definition || {};
    const content = def.content || {};
    const renderOptions = msgAttrs.render_options || {};

    const subject =
      content.subject ||
      def.subject ||
      msgAttrs.subject ||
      renderOptions.subject ||
      attrs.name ||
      "";

    const preview =
      content.preview_text ||
      def.preview_text ||
      msgAttrs.preview_text ||
      renderOptions.preview_text ||
      "";

    const stats = statsMap[c.id] || {};
    const recipients = Number(stats.recipients || 0);
    const delivered = Number(stats.delivered || recipients);
    const opens = Number(stats.opens_unique || 0);
    const clicks = Number(stats.clicks_unique || 0);
    const orders = Number(stats.conversions || 0);
    const rev = Number(stats.conversion_value || 0);
    const unsub = Number(stats.unsubscribes || 0);

    const orFromStats = Number(stats.open_rate || 0);
    const crFromStats = Number(stats.click_rate || 0);

    const or = orFromStats > 0
      ? (orFromStats <= 1 ? orFromStats * 100 : orFromStats)
      : (delivered > 0 ? (opens / delivered) * 100 : 0);

    const cr = crFromStats > 0
      ? (crFromStats <= 1 ? crFromStats * 100 : crFromStats)
      : (delivered > 0 ? (clicks / delivered) * 100 : 0);

    return {
      id: c.id,
      name: attrs.name || subject,
      date,
      subject,
      preview,
      recipients,
      delivered,
      opens,
      or: Number(or.toFixed(2)),
      clicks,
      cr: Number(cr.toFixed(2)),
      orders,
      rev: Number(rev.toFixed(2)),
      unsub,
      type: inferType(subject, attrs.name || ""),
      html: true
    };
  })
  .filter(c => !!c.date)
  .sort((a, b) => b.date.localeCompare(a.date));
}
