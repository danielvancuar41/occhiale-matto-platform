import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODELS, buildEmailPrompt, buildHtmlPrompt } from "@/lib/anthropic";
import type { Campaign, Product } from "@/lib/anthropic";

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
    notes: body.notes
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
    strategy: body.strategy || ""
  });

  const resp = await anthropic.messages.create({
    model: MODELS.strategic,
    max_tokens: 12000,
    messages: [{ role: "user", content: prompt }]
  });

  const html = resp.content
    .filter(b => b.type === "text")
    .map(b => (b as any).text)
    .join("\n")
    .replace(/^```html\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  return NextResponse.json({ ok: true, html });
}
