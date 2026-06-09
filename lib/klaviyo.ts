/**
 * Klaviyo Campaigns Loader v3
 *
 * Adds rate-limit handling for the Reports API (429 throttling):
 * - Smaller batches (20 IDs)
 * - Mandatory 1.2s sleep between batches
 * - Auto-retry on 429 with exponential backoff
 */

const KLAVIYO_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";

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

  console.log("[klaviyo] listCampaigns start");

  while (path && all.length < maxItems) {
    const data: any = await klaviyoFetch(path);
    if (Array.isArray(data?.data)) all.push(...data.data);
    if (Array.isArray(data?.included)) included.push(...data.included);
    const next = data?.links?.next;
    if (!next) break;
    path = next.replace(KLAVIYO_BASE, "");
  }

  if (all.length === 0) {
    console.warn("[klaviyo] filter returned 0 — retrying without channel filter");
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

  console.log("[klaviyo] listCampaigns done:", all.length, "campaigns");
  return all.slice(0, maxItems);
}

/**
 * Single Reports API call with retry on 429.
 */
async function reportsCallWithRetry(
  body: any,
  attempt = 1,
  maxAttempts = 4
): Promise<{ ok: boolean; status: number; json?: any; errorText?: string; retryAfterMs?: number }> {
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

  if (res.ok) {
    return { ok: true, status: res.status, json: await res.json() };
  }

  const text = await res.text();

  // Handle 429 throttling: retry with backoff
  if (res.status === 429 && attempt < maxAttempts) {
    // Parse "Expected available in X second" from the error text
    let waitSec = 2 * attempt; // default: 2s, 4s, 6s
    const m = text.match(/Expected available in (\d+(?:\.\d+)?) second/);
    if (m) waitSec = Math.max(parseFloat(m[1]) + 0.5, waitSec);

    const waitMs = Math.ceil(waitSec * 1000);
    console.warn(`[klaviyo] 429 throttled (attempt ${attempt}/${maxAttempts}), waiting ${waitMs}ms`);
    await sleep(waitMs);
    return reportsCallWithRetry(body, attempt + 1, maxAttempts);
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

  console.log(`[klaviyo] Reports batch returned ${rows.length} rows`);
  if (rows.length > 0) {
    console.log("[klaviyo] Sample row keys:", Object.keys(rows[0] || {}));
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

  const campaigns = await listCampaigns(maxItems);
  if (!campaigns.length) return [];

  const ids = campaigns.map(c => c.id);
  const statsMap: Record<string, any> = {};

  // Batch in groups of 20 with 1.2s pause between batches
  const BATCH_SIZE = 20;
  const PAUSE_MS = 1200;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(ids.length / BATCH_SIZE);

    console.log(`[klaviyo] stats batch ${batchNum}/${totalBatches} (${batch.length} ids)`);

    try {
      const map = await getStatsForCampaigns(batch);
      Object.assign(statsMap, map);
      console.log(`[klaviyo] batch ${batchNum} ok: mapped ${Object.keys(map).length} stats so far`);
    } catch (err: any) {
      console.error(`[klaviyo] batch ${batchNum} failed:`, err?.message || err);
      _lastStatsError = err?.message || String(err);
    }

    // Pause before next batch (skip after the last one)
    if (i + BATCH_SIZE < ids.length) {
      await sleep(PAUSE_MS);
    }
  }

  console.log(`[klaviyo] total stats mapped: ${Object.keys(statsMap).length} / ${ids.length}`);

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
