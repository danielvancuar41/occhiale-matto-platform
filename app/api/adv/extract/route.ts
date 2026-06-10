import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODELS } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExtractRequest = {
  imageBase64?: string;   // base64 without data: prefix
  imageMediaType?: string; // e.g. "image/png" | "image/jpeg"
  text?: string;          // alternative: paste raw text
};

const SYSTEM_PROMPT = `Sei un assistente che estrae dati ADV Meta (Facebook/Instagram Ads) da screenshot o testo libero.
L'utente è Pier (Beehind Studio) e gestisce le ads del brand Occhiale Matto (e-commerce occhiali da sole €29,99).
I report settimanali arrivano dai media buyer in formati vari: messaggi WhatsApp/Telegram, screenshot di Meta Business Manager, email, note.

I dati possono includere fino a 3 tipologie di campagna:
- ACQUISIZIONE (acq): campagne cold per nuovi clienti
- RETARGETING (ret): campagne warm per chi ha già visitato
- TRAFFICO (tra): campagne click verso il profilo IG / sito

Per ogni tipologia possono esserci: spesa (€), impression, click, acquisti, revenue (€).
Sinonimi comuni:
- "spesa" = "importo speso" = "budget" = "ad spend"
- "acquisti" = "conversioni" = "ordini" = "purchase"
- "revenue" = "fatturato" = "vendite" = "sales" = "valore conversioni"
- "impression" = "impressioni" = "visualizzazioni"
- "click" = "click sul link" = "clicks"

Il report a volte include anche derivati come CPA e ROAS: NON estrarli (li calcoliamo noi).

Rispondi SEMPRE ed ESCLUSIVAMENTE con un oggetto JSON valido, senza preamboli, senza markdown, senza testo prima o dopo. Schema esatto:

{
  "week_number": number | null,
  "week_label": string | null,
  "week_start": string | null,  // ISO date "YYYY-MM-DD"
  "week_end": string | null,    // ISO date "YYYY-MM-DD"
  "acq_spesa": number,
  "acq_impression": number,
  "acq_click": number,
  "acq_acquisti": number,
  "acq_revenue": number,
  "ret_spesa": number,
  "ret_impression": number,
  "ret_click": number,
  "ret_acquisti": number,
  "ret_revenue": number,
  "tra_spesa": number,
  "tra_impression": number,
  "tra_click": number,
  "notes": string | null,
  "confidence": "high" | "medium" | "low",
  "warnings": string[]
}

Regole importanti:
1. Se un dato non è presente, metti 0 (non null) per i campi numerici di campagna.
2. Per metadati (week_number, week_label, week_start, week_end, notes) usa null se non presenti.
3. Date in formato ISO "YYYY-MM-DD" (es. "2026-05-11"). Se vedi "ultimi 7 gg" e non c'è data precisa, lascia null.
4. Numeri SEMPRE come numeri (non stringhe). "€85,82" → 85.82. "€969,01" → 969.01. Virgola = separatore decimale italiano.
5. Se ci sono più "totali" (es. "Total sales 4839 / acquisti reali 110"), prendi quelli come revenue+acquisti aggregati nel campo Acquisizione SOLO se non è già chiaro che siano divisi (in caso di dubbio metti in note).
6. confidence: "high" se tutti i campi sono chiari, "medium" se manca qualcosa, "low" se i dati sono ambigui o parziali.
7. warnings: lista di stringhe brevi su cose ambigue o assunzioni fatte (es. ["Date settimana non specificate", "Revenue totale assegnato all'acquisizione"]).
8. Il campo "notes" deve contenere qualunque commento testuale rilevante presente nel report (es. "vi segnalo che molti competitors hanno PROMO attive", "lanciata nuova creatività").

NESSUN altro testo oltre al JSON.`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExtractRequest;

    if (!body.imageBase64 && !body.text) {
      return NextResponse.json(
        { ok: false, error: "Fornisci un'immagine (imageBase64) o del testo (text)" },
        { status: 400 }
      );
    }

    // Build messages content (multimodal if image, text-only otherwise)
    const content: any[] = [];

    if (body.imageBase64) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: body.imageMediaType || "image/png",
          data: body.imageBase64
        }
      });
      content.push({
        type: "text",
        text: "Estrai i dati ADV dallo screenshot allegato. Rispondi solo con JSON come da schema."
      });
    } else if (body.text) {
      content.push({
        type: "text",
        text: `Estrai i dati ADV dal seguente testo. Rispondi solo con JSON come da schema.\n\n--- TESTO ---\n${body.text}\n--- FINE TESTO ---`
      });
    }

    const resp = await anthropic.messages.create({
      model: MODELS.strategic,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }]
    });

    const raw = resp.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    // Strip possible markdown code fences
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[/api/adv/extract] JSON parse failed. Raw:", raw);
      return NextResponse.json(
        {
          ok: false,
          error: "Claude ha risposto in formato non JSON. Probabilmente l'input non è abbastanza chiaro.",
          raw: raw.slice(0, 500)
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ ok: true, extracted: parsed });
  } catch (err: any) {
    console.error("[/api/adv/extract] error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
