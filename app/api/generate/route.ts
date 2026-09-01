import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODELS, buildEmailPrompt, buildHtmlPrompt, OM_LOGO_DARK } from "@/lib/anthropic";
import type { Campaign, Product, TemplateStyle, ColorMode, StatementPosition } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 300;

type GenerateRequest = {
  mode: "strategy" | "html";
  emailType: string;
  selectedProducts: Product[];
  recentCampaigns: Campaign[];
  topPerformers?: Campaign[];
  focus?: string;
  notes?: string;
  chosenSubject?: string;
  chosenPreview?: string;
  strategy?: string;
  templateStyle?: TemplateStyle;
  colorMode?: ColorMode;
  statementPosition?: StatementPosition;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured on the server" },
        { status: 500 }
      );
    }

    if (body.mode === "strategy") {
      return await generateStrategy(body);
    }
    if (body.mode === "html") {
      return await generateHtml(body);
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err: any) {
    console.error("[generate] error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

async function generateStrategy(body: GenerateRequest) {
  const topPerformers =
    body.topPerformers ||
    [...body.recentCampaigns]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

  const prompt = buildEmailPrompt({
    emailType: body.emailType,
    selectedProducts: body.selectedProducts,
    recentCampaigns: body.recentCampaigns,
    topPerformers,
    focus: body.focus,
    notes: body.notes,
    templateStyle: body.templateStyle || "classico"
  });

  const resp = await anthropic.messages.create({
    model: MODELS.strategic,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }]
  });

  const text = resp.content
    .filter(b => b.type === "text")
    .map(b => (b as any).text)
    .join("\n")
    .trim();

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Claude did not return valid JSON", raw: text },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, ...parsed });
}

async function generateHtml(body: GenerateRequest) {
  if (!body.chosenSubject || !body.chosenPreview) {
    return NextResponse.json(
      { error: "chosenSubject and chosenPreview required for html mode" },
      { status: 400 }
    );
  }

  const prompt = buildHtmlPrompt({
    chosenSubject: body.chosenSubject,
    chosenPreview: body.chosenPreview,
    emailType: body.emailType,
    selectedProducts: body.selectedProducts,
    strategy: body.strategy || "",
    templateStyle: body.templateStyle || "classico",
    colorMode: body.colorMode || "light",
    statementPosition: body.statementPosition || "top"
  });

  const resp = await anthropic.messages.create({
    model: MODELS.strategic,
    max_tokens: 12000,
    messages: [{ role: "user", content: prompt }]
  });

  let html = resp.content
    .filter(b => b.type === "text")
    .map(b => (b as any).text)
    .join("\n")
    .replace(/^```html\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  // ── SOSTITUZIONE PLACEHOLDER → URL ESATTI ──
  // Claude usa {{IMG_n}} / {{URL_n}} / {{LOGO}} invece di ricopiare gli URL
  // (evita typo negli URL immagine, causa di immagini rotte). Qui li rimpiazziamo
  // con i valori esatti dal catalog, byte per byte.
  const LOGO_WHITE = "https://d3k81ch9hvuctc.cloudfront.net/company/SuvjeA/images/efab9e30-782b-4853-8d7b-d6184c7e3458.png";
  const templateStyle = body.templateStyle || "classico";
  const logoUrl = templateStyle === "statement" ? OM_LOGO_DARK : LOGO_WHITE;

  const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const replaceAll = (str: string, find: string, repl: string) =>
    str.replace(new RegExp(escapeReg(find), "g"), repl);

  (body.selectedProducts || []).forEach((p, i) => {
    html = replaceAll(html, `{{IMG_${i}}}`, p.img || "");
    html = replaceAll(html, `{{URL_${i}}}`, p.url || "");
  });
  html = replaceAll(html, "{{LOGO}}", logoUrl);

  // Sicurezza: se restano placeholder non sostituiti (es. Claude ne ha inventato uno
  // in più), li puliamo verso il primo prodotto per non lasciare {{...}} nell'email.
  const fallbackImg = body.selectedProducts?.[0]?.img || "";
  const fallbackUrl = body.selectedProducts?.[0]?.url || "";
  html = html.replace(/\{\{IMG_\d+\}\}/g, fallbackImg)
             .replace(/\{\{URL_\d+\}\}/g, fallbackUrl)
             .replace(/\{\{LOGO\}\}/g, logoUrl);

  return NextResponse.json({ ok: true, html });
}
