/**
 * Klaviyo API wrapper
 * Docs: https://developers.klaviyo.com/en/reference/api_overview
 *
 * Uses the 2024-10-15 revision (stable at time of writing - adjust if Klaviyo updates).
 */

const KLAVIYO_BASE = "https://a.klaviyo.com/api";
const REVISION = "2024-10-15";

function headers() {
  const key = process.env.KLAVIYO_API_KEY;
  if (!key) throw new Error("KLAVIYO_API_KEY is not set");
  return {
    Authorization: `Klaviyo-API-Key ${key}`,
    revision: REVISION,
    accept: "application/json",
    "content-type": "application/json"
  };
}

export type KlaviyoCampaign = {
  id: string;
  name: string;
  subject: string;
  sendTime: string;
  status: string;
};

export type KlaviyoCampaignStats = {
  id: string;
  recipients: number;
  opens: number;
  openRate: number;
  clicks: number;
  clickRate: number;
  placedOrders: number;
  revenue: number;
  unsubscribes: number;
  bounces: number;
};

/**
 * List recent email campaigns (sent status).
 */
export async function listCampaigns(limit = 50): Promise<KlaviyoCampaign[]> {
  const url = new URL(`${KLAVIYO_BASE}/campaigns`);
  url.searchParams.set("filter", "equals(messages.channel,'email')");
  url.searchParams.set("page[size]", String(limit));
  url.searchParams.set("sort", "-created_at");

  const res = await fetch(url.toString(), { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Klaviyo listCampaigns failed: ${res.status} ${await res.text()}`);
  const json = await res.json();

  return (json.data || []).map((c: any) => ({
    id: c.id,
    name: c.attributes?.name || "",
    subject: c.attributes?.audiences?.included?.[0]?.subject || c.attributes?.name || "",
    sendTime: c.attributes?.send_time || c.attributes?.scheduled_at || "",
    status: c.attributes?.status || ""
  }));
}

/**
 * Fetch stats for a single campaign using the reporting endpoint.
 * Note: Klaviyo's reporting endpoint requires a POST with specific filter structure.
 */
export async function getCampaignStats(campaignId: string): Promise<KlaviyoCampaignStats | null> {
  const body = {
    data: {
      type: "campaign-values-report",
      attributes: {
        statistics: [
          "recipients",
          "opens_unique",
          "open_rate",
          "clicks_unique",
          "click_rate",
          "conversions",
          "conversion_value",
          "unsubscribes",
          "bounces"
        ],
        timeframe: { key: "last_365_days" },
        conversion_metric_id: process.env.KLAVIYO_CONVERSION_METRIC_ID || "",
        filter: `equals(campaign_id,"${campaignId}")`
      }
    }
  };

  const res = await fetch(`${KLAVIYO_BASE}/campaign-values-reports/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!res.ok) {
    console.error("[klaviyo] stats failed:", res.status, await res.text());
    return null;
  }

  const json = await res.json();
  const row = json.data?.attributes?.results?.[0];
  if (!row) return null;

  const s = row.statistics || {};
  return {
    id: campaignId,
    recipients: Number(s.recipients || 0),
    opens: Number(s.opens_unique || 0),
    openRate: Number(s.open_rate || 0) * 100,
    clicks: Number(s.clicks_unique || 0),
    clickRate: Number(s.click_rate || 0) * 100,
    placedOrders: Number(s.conversions || 0),
    revenue: Number(s.conversion_value || 0),
    unsubscribes: Number(s.unsubscribes || 0),
    bounces: Number(s.bounces || 0)
  };
}
