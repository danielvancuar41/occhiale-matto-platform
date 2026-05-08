/**
 * Klaviyo Campaigns Loader
 *
 * Fetches the last N email campaigns from Klaviyo, enriches them with
 * recipient/open/click/revenue stats, and shapes them into the format
 * used by the dashboard (matches the legacy hardcoded CAMPAIGNS array).
 *
 * Uses Private API Key (KLAVIYO_API_KEY env var) — read-only operations.
 */

const KLAVIYO_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";

export type EnrichedCampaign = {
  id: string;
  name: string;
  date: string;          // ISO YYYY-MM-DD
  subject: string;
  preview?: string;
  recipients: number;
  delivered: number;
  opens: number;         // unique opens
  or: number;            // open rate %
  clicks: number;        // unique clicks
  cr: number;            // click rate %
  orders: number;
  rev: number;           // revenue €
  unsub: number;
  type: CampaignType;    // inferred
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

/**
 * Inferred type from subject keywords. Mirrors the v1 logic so the UI
 * tipology buckets stay consistent with the old hardcoded data.
 */
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

/**
 * Step 1: list email campaigns. Klaviyo paginates via `next` URL.
 * We fetch up to maxItems campaigns sorted by send time desc.
 */
async function listCampaigns(maxItems = 75): Promise<any[]> {
  const filter = `filter=${encodeURIComponent('equals(messages.channel,"email")')}`;
  const sort = "sort=-scheduled_at";
  const include = "include=campaign-messages";
  const fields = "fields[campaign-message]=definition,channel";

  const all: any[] = [];
  let path: string | null = `/campaigns/?${filter}&${sort}&${include}&${fields}`;
  let included: any[] = [];

  while (path && all.length < maxItems) {
    const data: any = await klaviyoFetch(path);
    if (Array.isArray(data?.data)) all.push(...data.data);
    if (Array.isArray(data?.included)) included.push(...data.included);
    const next = data?.links?.next;
    if (!next) break;
    // Klaviyo returns full URL, strip the base
    path = next.replace(KLAVIYO_BASE, "");
  }

  // attach included messages to each campaign for subject extraction
  for (const c of all) {
    const msgIds = c?.relationships?.["campaign-messages"]?.data?.map((m: any) => m.id) || [];
    c._messages = msgIds.map((id: string) =>
      included.find((i: any) => i.type === "campaign-message" && i.id === id)
    ).filter(Boolean);
  }

  return all.slice(0, maxItems);
}

/**
 * Step 2: get aggregated stats for a batch of campaigns via Reporting API.
 * The campaign-values-reports endpoint accepts up to 100 campaign IDs at a time.
 */
async function getStatsForCampaigns(campaignIds: string[]): Promise<Record<string, any>> {
  if (!campaignIds.length) return {};

  const conversionMetricId = process.env.KLAVIYO_CONVERSION_METRIC_ID;
  if (!conversionMetricId) {
    console.warn("[klaviyo] KLAVIYO_CONVERSION_METRIC_ID missing — revenue/orders will be 0");
  }

  const apiKey = process.env.KLAVIYO_API_KEY;
  const body = {
    data: {
      type: "campaign-values-report",
      attributes: {
        statistics: [
          "recipients", "delivered", "opens_unique", "clicks_unique",
          "bounced", "unsubscribes", "open_rate", "click_rate",
          "conversions", "conversion_value"
        ],
        timeframe: { key: "last_365_days" },
        conversion_metric_id: conversionMetricId || undefined,
        filter: `any(campaign_id,["${campaignIds.join('","')}"])`
      }
    }
  };

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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Klaviyo Reports ${res.status}: ${text.slice(0, 200)}`);
  }

  const json: any = await res.json();
  const map: Record<string, any> = {};
  const rows = json?.data?.attributes?.results || [];
  for (const row of rows) {
    const cid = row?.groupings?.campaign_id;
    if (cid) map[cid] = row.statistics || {};
  }
  return map;
}

/**
 * Main entry point. Returns the last N campaigns enriched with stats,
 * shaped for the dashboard UI.
 */
export async function fetchEnrichedCampaigns(maxItems = 75): Promise<EnrichedCampaign[]> {
  const campaigns = await listCampaigns(maxItems);
  if (!campaigns.length) return [];

  const ids = campaigns.map(c => c.id);
  // Reports API accepts up to 100 at once; we batch in groups of 50 for safety
  const statsMap: Record<string, any> = {};
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    try {
      const map = await getStatsForCampaigns(batch);
      Object.assign(statsMap, map);
    } catch (err) {
      console.error("[klaviyo] stats batch failed:", err);
    }
  }

  return campaigns.map((c): EnrichedCampaign => {
    const attrs = c.attributes || {};
    const sentAt: string = attrs.send_time || attrs.scheduled_at || attrs.created_at || "";
    const date = sentAt ? sentAt.slice(0, 10) : "";

    // subject from first message definition
    const firstMsg = c._messages?.[0];
    const def = firstMsg?.attributes?.definition || {};
    const content = def?.content || {};
    const subject = content.subject || attrs.name || "";
    const preview = content.preview_text || "";

    const stats = statsMap[c.id] || {};
    const recipients = Number(stats.recipients || 0);
    const delivered = Number(stats.delivered || recipients);
    const opens = Number(stats.opens_unique || 0);
    const clicks = Number(stats.clicks_unique || 0);
    const orders = Number(stats.conversions || 0);
    const rev = Number(stats.conversion_value || 0);
    const unsub = Number(stats.unsubscribes || 0);

    const or = delivered > 0 ? (opens / delivered) * 100 : 0;
    const cr = delivered > 0 ? (clicks / delivered) * 100 : 0;

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
  // Filter out campaigns that never sent (no recipients or no date)
  .filter(c => c.recipients > 0 && c.date)
  // Most recent first
  .sort((a, b) => b.date.localeCompare(a.date));
}
