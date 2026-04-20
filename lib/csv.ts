import type { Campaign } from "./anthropic";

/**
 * Parse a Klaviyo campaigns CSV export into normalized Campaign objects.
 * Handles the exact column format exported by Klaviyo (as of 2025).
 */
export function parseKlaviyoCsv(csv: string): Campaign[] {
  const rows = splitCsvRows(csv);
  if (rows.length < 2) return [];

  const header = rows[0].map(h => h.trim());
  const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());

  const iName = idx("Campaign Name");
  const iSubject = idx("Subject");
  const iSendTime = idx("Send Time");
  const iWeekday = idx("Send Weekday");
  const iRecipients = idx("Total Recipients");
  const iOrders = idx("Unique Placed Order");
  const iRevenue = idx("Revenue");
  const iOpens = idx("Unique Opens");
  const iOpenRate = idx("Open Rate");
  const iClicks = idx("Unique Clicks");
  const iClickRate = idx("Click Rate");
  const iUnsub = idx("Unsubscribes");

  const campaigns: Campaign[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 5) continue;

    const name = row[iName] || "";
    const subject = row[iSubject] || "";
    const sendTime = row[iSendTime] || "";
    if (!name || !sendTime) continue;

    campaigns.push({
      name,
      subject: subject.replace(/\[MULTIPLE VARIATIONS\]/, "").trim() || name,
      sendDate: sendTime.split(" ")[0],
      weekday: row[iWeekday] || "",
      recipients: parseNum(row[iRecipients]),
      opens: parseNum(row[iOpens]),
      openRate: parsePercent(row[iOpenRate]),
      clicks: parseNum(row[iClicks]),
      clickRate: parsePercent(row[iClickRate]),
      orders: parseNum(row[iOrders]),
      revenue: parseNum(row[iRevenue]),
      unsubscribes: parseNum(row[iUnsub])
    });
  }

  return campaigns.sort((a, b) => b.sendDate.localeCompare(a.sendDate));
}

function parseNum(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function parsePercent(v: string | undefined): number {
  if (!v) return 0;
  return parseFloat(v.replace(/%/g, "").replace(/,/g, "")) || 0;
}

/**
 * Simple CSV splitter that handles quoted fields with embedded commas and newlines.
 */
function splitCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    const next = csv[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\r") { /* skip */ }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else { field += c; }
    }
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }

  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
}
