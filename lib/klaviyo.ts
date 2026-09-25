/**
 * Klaviyo Campaigns Loader v4
 *
 * Il Reports API (campaign-values-reports) ha limiti durissimi:
 *   Burst 1/s — Steady 2/min — Daily 225/giorno
 * La v3 faceva 1 chiamata ogni 20 campagne (4 chiamate con limit=75) ad ogni
 * caricamento pagina → 429 già dalla 3a chiamata, retry con attese da 30s+,
 * funzione Vercel oltre i 60s → timeout.
 *
 * v4:
 * - UNA sola chiamata Reports per richiesta: filtro solo su send_channel=email,
 *   Klaviyo restituisce già una riga per campagna/messaggio.
 * - Righe aggregate per campaign_id (campagne A/B hanno più messaggi).
 * - Retry su 429 solo se l'attesa sta nel time budget, altrimenti si torna
 *   subito con le campagne senza stats + statsError visibile.
 * - Cache in memoria (10 min) per istanza calda, così i reload non bruciano quota.
 * - Rimosso il fallback senza filtro canale: Klaviyo lo rifiuta sempre con 400.
 * - Errori 401/403 tradotti (chiave errata / scope mancante).
 */

const KLAVIYO_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2025-10-15";

const STATS_CACHE_TTL_MS = 10 * 60 * 1000;
const REPORTS_MAX_WAIT_MS = 20000;

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

type AggregatedStats = {
  recipients: number;
  delivered: number;
  opens_unique: number;
  clicks_unique: number;
  bounced: number;
  unsubscribes: number;
  conversions: number;
  conversion_value: number;
};

let _lastStatsError: string | null = null;
export function getLastStatsError() { return _lastStatsError; }

let _statsCache: { at: number; map: Record<string, AggregatedStats> } | null = null;

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

function headers(apiKey: string) {
  return {
    "Authorization": `Klaviyo-API-Key ${apiKey}`,
    "Accept": "application/json",
    "Content-Type": "application/json",
    "revision": KLAVIYO_REVISION
  };
}

function explainError(status: number, text: string): string {
  const snippet = text.slice(0, 300);
  if (status === 401) return `Klaviyo 401: API key non valida o revocata (KLAVIYO_API_KEY). ${snippet}`;
  if (status === 403) return `Klaviyo 403: la private key non ha gli scope necessari (campaigns:read, metrics:read). ${snippet}`;
  if (status === 429) return `Klaviyo 429: rate limit raggiunto, riprova tra qualche minuto. ${snippet}`;
  return `Klaviyo ${status}: ${snippet}`;
}

async function klaviyoFetch(path: string): Promise<any> {
  const apiKey = process.env.KLAVIYO_API_KEY?.trim();
  if (!apiKey) throw new Error("KLAVIYO_API_KEY non configurata su Vercel");

  const res = await fetch(`${KLAVIYO_BASE}${path}`, {
    headers: headers(apiKey),
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(explainError(res.status, text));
  }
  return res.json();
}

async function listCampaigns(maxItems = 50, timeBudgetMs = 20000): Promise<any[]> {
  // Il filtro canale è OBBLIGATORIO su GET /campaigns
  const filter = `filter=${encodeURIComponent("equals(messages.channel,'email')")}`;
  const sort = "sort=-scheduled_at";
  const include = "include=campaign-messages";

  const all: any[] = [];
  const included: any[] = [];
  let path: string | null = `/campaigns/?${filter}&${sort}&${include}`;
  const start = Date.now();

  while (path && all.length < maxItems) {
    if (Date.now() - start > timeBudgetMs) {
      console.warn(`[klaviyo] listCampaigns time budget exceeded at ${all.length} campaigns`);
      break;
    }
    const data: any = await klaviyoFetch(path);
    if (Array.isArray(data?.data)) all.push(...data.data);
    if (Array.isArray(data?.included)) included.push(...data.included);
    const next: string | undefined = data?.links?.next;
    path = next ? next.replace(KLAVIYO_BASE, "") : null;
  }

  for (const c of all) {
    const msgIds = c?.relationships?.["campaign-messages"]?.data?.map((m: any) => m.id) || [];
    c._messages = msgIds
      .map((id: string) => included.find((i: any) => i.type === "campaign-message" && i.id === id))
      .filter(Boolean);
  }

  console.log(`[klaviyo] listCampaigns done: ${all.length} campaigns in ${Date.now() - start}ms`);
  return all.slice(0, maxItems);
}

async function reportsCall(body: any, deadline: number, attempt = 1): Promise<
  { ok: boolean; status: number; json?: any; errorText?: string }
> {
  const apiKey = process.env.KLAVIYO_API_KEY!.trim();

  const res = await fetch(`${KLAVIYO_BASE}/campaign-values-reports/`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (res.ok) return { ok: true, status: res.status, json: await res.json() };

  const text = await res.text();

  if (res.status === 429 && attempt < 3) {
    const retryAfterHeader = Number(res.headers.get("retry-after"));
    const m = text.match(/Expected available in (\d+(?:\.\d+)?) second/);
    const waitSec = m ? parseFloat(m[1]) + 0.5 : (retryAfterHeader || 2 * attempt);
    const waitMs = Math.ceil(waitSec * 1000);

    if (Date.now() + waitMs < deadline) {
      console.warn(`[klaviyo] Reports 429, attendo ${waitMs}ms (tentativo ${attempt})`);
      await sleep(waitMs);
      return reportsCall(body, deadline, attempt + 1);
    }
    console.warn(`[klaviyo] Reports 429, attesa ${waitMs}ms fuori budget: salto le stats`);
  }

  return { ok: false, status: res.status, errorText: text };
}

async function getAllEmailCampaignStats(): Promise<Record<string, AggregatedStats>> {
  if (_statsCache && Date.now() - _statsCache.at < STATS_CACHE_TTL_MS) {
    console.log("[klaviyo] stats da cache in memoria");
    return _statsCache.map;
  }

  const conversionMetricId = process.env.KLAVIYO_CONVERSION_METRIC_ID?.trim();
  if (!conversionMetricId) {
    _lastStatsError = "KLAVIYO_CONVERSION_METRIC_ID non configurato su Vercel: il Reports API lo richiede.";
    console.error(`[klaviyo] ${_lastStatsError}`);
    return {};
  }

  const body = {
    data: {
      type: "campaign-values-report",
      attributes: {
        statistics: [
          "recipients", "delivered", "opens_unique", "clicks_unique",
          "bounced", "unsubscribes", "conversions", "conversion_value"
        ],
        timeframe: { key: "last_365_days" },
        conversion_metric_id: conversionMetricId,
        filter: "equals(send_channel,'email')"
      }
    }
  };

  const result = await reportsCall(body, Date.now() + REPORTS_MAX_WAIT_MS);

  if (!result.ok) {
    _lastStatsError = `Reports: ${explainError(result.status, result.errorText || "")}`;
    console.error(`[klaviyo] ${_lastStatsError}`);
    return {};
  }

  const rows: any[] = result.json?.data?.attributes?.results || [];
  console.log(`[klaviyo] Reports: ${rows.length} righe`);

  const map: Record<string, AggregatedStats> = {};
  for (const row of rows) {
    const cid = row?.groupings?.campaign_id;
    if (!cid) continue;
    const s = row.statistics || {};
    const acc = map[cid] || (map[cid] = {
      recipients: 0, delivered: 0, opens_unique: 0, clicks_unique: 0,
      bounced: 0, unsubscribes: 0, conversions: 0, conversion_value: 0
    });
    acc.recipients += Number(s.recipients || 0);
    acc.delivered += Number(s.delivered || 0);
    acc.opens_unique += Number(s.opens_unique || 0);
    acc.clicks_unique += Number(s.clicks_unique || 0);
    acc.bounced += Number(s.bounced || 0);
    acc.unsubscribes += Number(s.unsubscribes || 0);
    acc.conversions += Number(s.conversions || 0);
    acc.conversion_value += Number(s.conversion_value || 0);
  }

  _statsCache = { at: Date.now(), map };
  return map;
}

export async function fetchEnrichedCampaigns(maxItems = 50): Promise<EnrichedCampaign[]> {
  _lastStatsError = null;
  const start = Date.now();

  const campaigns = await listCampaigns(maxItems);
  if (!campaigns.length) return [];

  const statsMap = await getAllEmailCampaignStats();

  const withStats = campaigns.filter(c => statsMap[c.id]).length;
  console.log(`[klaviyo] stats mappate ${withStats}/${campaigns.length} in ${Date.now() - start}ms`);
  if (!_lastStatsError && Object.keys(statsMap).length > 0 && withStats === 0) {
    _lastStatsError = "Reports OK ma nessuna campagna combacia: controlla che la key sia dello stesso account Klaviyo.";
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
      content.subject || def.subject || msgAttrs.subject || renderOptions.subject || attrs.name || "";
    const preview =
      content.preview_text || def.preview_text || msgAttrs.preview_text || renderOptions.preview_text || "";

    const s = statsMap[c.id];
    const recipients = s?.recipients || 0;
    const delivered = s?.delivered || recipients;
    const opens = s?.opens_unique || 0;
    const clicks = s?.clicks_unique || 0;
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
      orders: s?.conversions || 0,
      rev: Number((s?.conversion_value || 0).toFixed(2)),
      unsub: s?.unsubscribes || 0,
      type: inferType(subject, attrs.name || ""),
      html: true
    };
  })
  .filter(c => !!c.date)
  .sort((a, b) => b.date.localeCompare(a.date));
}
