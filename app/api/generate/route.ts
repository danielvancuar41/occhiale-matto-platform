import { NextRequest, NextResponse } from "next/server";
import {
  runClaude,
  parseJsonLoose,
  ClaudeRefusalError,
  buildStrategyPrompt,
  buildHtmlPrompt,
  STRATEGY_SCHEMA,
  OM_LOGO_DARK,
  OM_LOGO_WHITE
} from "@/lib/anthropic";
import type { Campaign, Product, TemplateStyle, ColorMode, StatementPosition } from "@/lib/anthropic";
import { postProcessHtml } from "@/lib/html-postprocess";

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
  chosenStatement?: string;
  strategy?: string;
  templateStyle?: TemplateStyle;
  colorMode?: ColorMode;
  statementPosition?: StatementPosition;
};

const MAX_PRODUCTS = 12;
const TEMPLATES: TemplateStyle[] = ["classico", "minimal", "bold", "editorial", "statement"];
const COLOR_MODES: ColorMode[] = ["light", "dark"];
const POSITIONS: StatementPosition[] = ["top", "bottom", "both"];

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const strList = (v: unknown, maxItems: number, maxLen: number) =>
  Array.isArray(v) ? v.map(x => str(x, maxLen)).filter(Boolean).slice(0, maxItems) : [];
const oneOf = <T extends string>(v: unknown, allowed: T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

function sanitizeProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_PRODUCTS).map((p: any) => ({
    id: str(p?.id, 120),
    name: str(p?.name, 120),
    price: num(p?.price),
    category: str(p?.category, 30),
    url: str(p?.url, 500),
    img: str(p?.img, 1000),
    isNew: !!p?.isNew,
    features: strList(p?.features, 10, 60),
    colors: strList(p?.colors, 12, 60),
    details: str(p?.details, 200)
  })).filter(p => p.name && /^https:\/\//.test(p.url) && /^https:\/\//.test(p.img));
}

function sanitizeCampaigns(raw: unknown, max: number): Campaign[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, max).map((c: any) => ({
    name: str(c?.name, 200),
    subject: str(c?.subject, 200),
    sendDate: str(c?.sendDate, 20),
    weekday: str(c?.weekday, 20),
    type: str(c?.type, 30) || undefined,
    recipients: num(c?.recipients),
    opens: num(c?.opens),
    openRate: num(c?.openRate),
    clicks: num(c?.clicks),
    clickRate: num(c?.clickRate),
    orders: num(c?.orders),
    revenue: num(c?.revenue),
    unsubscribes: num(c?.unsubscribes)
  }));
}

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
    if (err instanceof ClaudeRefusalError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[generate] error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

async function generateStrategy(body: GenerateRequest) {
  const products = sanitizeProducts(body.selectedProducts);
  if (products.length === 0) {
    return NextResponse.json({ error: "Seleziona almeno un prodotto" }, { status: 400 });
  }

  const templateStyle = oneOf(body.templateStyle, TEMPLATES, "classico");
  const recentCampaigns = sanitizeCampaigns(body.recentCampaigns, 8);
  const topPerformers = body.topPerformers
    ? sanitizeCampaigns(body.topPerformers, 10)
    : [...recentCampaigns].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const { system, user } = buildStrategyPrompt({
    emailType: str(body.emailType, 60) || "Multi-Prodotto",
    selectedProducts: products,
    recentCampaigns,
    topPerformers,
    focus: str(body.focus, 1000),
    notes: str(body.notes, 2000),
    templateStyle
  });

  const { text, stopReason } = await runClaude({
    system,
    content: user,
    maxTokens: 8000,
    effort: "medium",
    jsonSchema: STRATEGY_SCHEMA
  });

  if (stopReason === "max_tokens") {
    return NextResponse.json({ error: "La risposta di Claude è stata troncata. Riprova." }, { status: 502 });
  }

  let parsed: any;
  try {
    parsed = parseJsonLoose(text);
  } catch {
    return NextResponse.json(
      { error: "Claude did not return valid JSON", raw: text.slice(0, 500) },
      { status: 502 }
    );
  }

  const isStatement = templateStyle === "statement";
  const subjects = (Array.isArray(parsed?.subjects) ? parsed.subjects : [])
    .filter((s: any) => typeof s?.text === "string" && s.text.trim())
    .map((s: any) => ({
      text: s.text.trim(),
      statement: isStatement ? String(s.statement || "").trim() : "",
      preview: String(s.preview || "").trim(),
      score: Number(s.score) || 0,
      rationale: String(s.rationale || "").trim()
    }));

  if (subjects.length === 0) {
    return NextResponse.json({ error: "Claude non ha proposto nessuna subject. Riprova." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, subjects, strategy: parsed.strategy || {} });
}

async function generateHtml(body: GenerateRequest) {
  const chosenSubject = str(body.chosenSubject, 200);
  const chosenPreview = str(body.chosenPreview, 300);
  if (!chosenSubject || !chosenPreview) {
    return NextResponse.json(
      { error: "chosenSubject and chosenPreview required for html mode" },
      { status: 400 }
    );
  }

  const products = sanitizeProducts(body.selectedProducts);
  if (products.length === 0) {
    return NextResponse.json({ error: "Seleziona almeno un prodotto" }, { status: 400 });
  }

  const templateStyle = oneOf(body.templateStyle, TEMPLATES, "classico");
  const { system, user } = buildHtmlPrompt({
    chosenSubject,
    chosenPreview,
    chosenStatement: str(body.chosenStatement, 120),
    emailType: str(body.emailType, 60) || "Multi-Prodotto",
    selectedProducts: products,
    strategy: str(body.strategy, 2000),
    templateStyle,
    colorMode: oneOf(body.colorMode, COLOR_MODES, "light"),
    statementPosition: oneOf(body.statementPosition, POSITIONS, "top")
  });

  // Effort "low": strategia e copy sono già decisi allo step 2, qui conta restare
  // sotto il limite di 300s di Vercel anche con molti prodotti.
  const { text, stopReason } = await runClaude({
    system,
    cacheSystem: true,
    content: user,
    maxTokens: 32000,
    effort: "low"
  });

  let html = text.replace(/^```html\s*/i, "").replace(/```\s*$/, "").trim();
  // Taglia eventuale testo prima di <!DOCTYPE>/<html> o dopo </html>
  const start = html.search(/<!DOCTYPE html|<html/i);
  if (start > 0) html = html.slice(start);
  const end = html.search(/<\/html>/i);
  if (end !== -1) html = html.slice(0, end + "</html>".length);

  // HTML incompleto = footer e disiscrizione persi: meglio un errore che un'email rotta.
  if (stopReason === "max_tokens" || end === -1) {
    return NextResponse.json(
      { error: "L'HTML generato è incompleto (risposta troncata). Clicca \"Rigenera HTML\"." },
      { status: 502 }
    );
  }

  const logoUrl = templateStyle === "statement" ? OM_LOGO_DARK : OM_LOGO_WHITE;
  const { html: finalHtml, warnings } = postProcessHtml(html, products, logoUrl);

  return NextResponse.json({ ok: true, html: finalHtml, warnings });
}
