/**
 * Klaviyo Campaigns Loader
 *
 * Fetches the last N email campaigns from Klaviyo, enriches them with
 * recipient/open/click/revenue stats, and shapes them into the format
 * used by the dashboard.
 *
 * Uses Private API Key (KLAVIYO_API_KEY env var) — read-only operations.
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

  console.log("[klaviyo] listCampaigns start, path:", path);

  while (path && all.length < maxItems) {
    const data: any = await klaviyoFetch(path);
    if (Array.isArray(data?.data)) all.push(...data.data);
    if (Array.isArray(data?.included)) included.push(...data.included);
    console.log(`[klaviyo] page fetched, accumulated=${all.length}, included=${included.length}`);
    const next = data?.links?.next;
    if (!next) break;
    path = next.replace(KLAVIYO_BASE, "");
  }

  // FALLBACK: if filter returned 0, try without filter
  if (all.length === 0) {
    console.warn("[klaviyo] filter returned 0 — retrying without channel filter");
    let fallbackPath: string | null = `/campaigns/?${sort}&${include}`;
    while (fallbackPath && all.length < maxItems) {
      const data: any = await klaviyoFetch(fallbackPath);
      if (Array.isArray(data?.data)) all.push(...data.data);
      if (Array.isArray(data?.included)) included.push(...data.included);
      console.log(`[klaviyo] fallback fetched, accumulated=${all.length}`);
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

  console.log("[klaviyo] listCampaigns done, returning", all.length, "campaigns");
  return all.slice(0, maxItems);
}

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
    console.error(`[klaviyo] Reports ${res.status}: ${text.slice(0, 200)}`);
    return {};
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

export async function fetchEnrichedCampaigns(maxItems = 75): Promise<EnrichedCampaign[]> {
  const campaigns = await listCampaigns(maxItems);
  if (!campaigns.length) return [];

  // Debug schema introspection
  if (campaigns[0]) {
    const sample = campaigns[0];
    console.log("[klaviyo] sample campaign attrs keys:", Object.keys(sample?.attributes || {}));
    console.log("[klaviyo] sample send_time:", sample?.attributes?.send_time);
    console.log("[klaviyo] sample scheduled_at:", sample?.attributes?.scheduled_at);
    console.log("[klaviyo] sample created_at:", sample?.attributes?.created_at);
    console.log("[klaviyo] sample name:", sample?.attributes?.name);
    if (sample._messages?.[0]) {
      console.log("[klaviyo] sample message attrs keys:", Object.keys(sample._messages[0]?.attributes || {}));
    }
  }

  const ids = campaigns.map(c => c.id);
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
  // Keep all campaigns with a valid date (don't filter by recipients)
  .filter(c => !!c.date)
  .sort((a, b) => b.date.localeCompare(a.date));
}
