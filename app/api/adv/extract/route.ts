import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODELS } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExtractRequest = {
  imageBase64?: string;
  imageMediaType?: string;
  text?: string;
  reportDate?: string;  // optional: date from screenshot meta (e.g. "Jan 27 post date")
};

const SYSTEM_PROMPT = `Sei un assistente che estrae dati ADV Meta (Facebook/Instagram Ads) da screenshot o testo libero per Pier (Beehind Studio), che gestisce le ads di Occhiale Matto (e-commerce occhiali da sole €29,99 italiano).

I report settimanali arrivano dai media buyer in formati vari: messaggi WhatsApp/Telegram/Notion, screenshot di chat, screenshot Meta Business Manager, email, note.

## STRUTTURA TIPICA DI UN REPORT

Sempre 3 sezioni (a volte una manca):

ACQUISIZIONE (acq) — campagne cold per nuovi clienti
RETARGETING (ret) — campagne warm per chi ha già visitato
TRAFFICO (tra) — campagne click verso il profilo IG / sito (no acquisti diretti)

Per ogni sezione il media buyer di solito riporta: spesa €, acquisti, CPA, ROAS. Talvolta anche revenue/impression/click.
Per traffico: spesa €, costo per visita, visite al profilo (le visite = click).

## REGOLE DI INTERPRETAZIONE CHIAVE

### 1. CALCOLA REVENUE DA ROAS (priorità alta!)
Se vedi ROAS ma NON vedi revenue/fatturato → calcola: revenue = spesa × ROAS
Esempi:
- "Spesa 454,88 / ROAS 4,78" → acq_revenue = 454.88 × 4.78 = 2174.33
- "Importo Speso 104,78 / ROAS 4,78" → ret_revenue = 104.78 × 4.78 = 500.85

Quando lo fai, aggiungi al warning array: "Revenue acquisizione calcolata da ROAS" e/o "Revenue retargeting calcolata da ROAS"

### 2. NON estrarre CPA (lo ricalcoliamo: spesa/acquisti)
Anche se è nel report, lascia perdere. Calcoliamo noi.

### 3. TRAFFICO — interpretazione
- "Costo per visita" → NON estrarre (calcolato)
- "Visite al profilo" → metti il numero in tra_click (visite = click in questo contesto)
- "Visualizzazioni" / "Impressioni" → tra_impression
- Per traffico NON ci sono mai acquisti/revenue

### 4. DATE — leggi con attenzione
- Cerca prima date esplicite (es. "01/06/2026", "1 giugno", "settimana 27/01-02/02")
- Se vedi solo una data tipo "Jan 27" o "27 gennaio" o "27/1" e il testo dice "ultimi 7 gg":
  * week_start = data trovata
  * week_end = data + 6 giorni
- Se vedi "ultimi 7 gg" senza data esplicita → lascia null entrambe (warning: "Date dedotte mancanti")
- Anno: se non specificato, usa l'anno corrente (2026 per ora)

### 5. SINONIMI ITALIANI COMUNI
- "spesa" = "importo speso" = "budget" = "ad spend"
- "acquisti" = "conversioni" = "ordini" = "purchase" = "vendite tracciate"
- "revenue" = "fatturato" = "valore conversioni" = "sales"
- "impression" = "impressioni" = "visualizzazioni"
- "click" = "click sul link" = "clicks"

### 6. NUMERI
- "€85,82" → 85.82 (virgola = decimale italiano)
- "€ 969,01" → 969.01 (spazi vanno ignorati)
- "€1.250,50" → 1250.50 (punto = migliaia in IT)

### 7. NOTE
Tutto il testo discorsivo non-numerico va in "notes":
- "vi segnalo che molti competitors hanno PROMO attive"
- "lanciata nuova creatività mercoledì"
- "weekend di sconti"
- "Total sales 4839 / acquisti reali 110" → metti in notes (totali aggregati, non chiaro come assegnarli)

### 8. DATI MANCANTI
Tutto è opzionale. Se manca un campo numerico → 0 (non null). Se manca un metadato → null.
Non bloccare l'estrazione, fai il meglio possibile.

## SCHEMA JSON DI RISPOSTA (rispondi SOLO con questo, niente preamboli, niente markdown)

{
  "week_number": number | null,
  "week_label": string | null,
  "week_start": string | null,
  "week_end": string | null,
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

NESSUN altro testo. Solo JSON.`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExtractRequest;

    if (!body.imageBase64 && !body.text) {
      return NextResponse.json(
        { ok: false, error: "Fornisci un'immagine (imageBase64) o del testo (text)" },
        { status: 400 }
      );
    }

    const content: any[] = [];
    const dateHint = body.reportDate ? `\n[Data report: ${body.reportDate}]` : "";

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
        text: `Estrai i dati ADV dallo screenshot allegato.${dateHint}\nRicorda: se trovi ROAS senza Revenue, CALCOLA Revenue = spesa × ROAS. Rispondi solo con JSON.`
      });
    } else if (body.text) {
      content.push({
        type: "text",
        text: `Estrai i dati ADV dal seguente testo.${dateHint}\nRicorda: se trovi ROAS senza Revenue, CALCOLA Revenue = spesa × ROAS.\n\n--- TESTO ---\n${body.text}\n--- FINE TESTO ---\n\nRispondi solo con JSON.`
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

    // Safety net: if AI forgot to compute revenue from ROAS, do it here as backup
    // (looks for ROAS hints in original text)
    if (body.text) {
      const text = body.text.toLowerCase();
      // Acquisizione
      if (parsed.acq_spesa > 0 && parsed.acq_revenue === 0) {
        const acqRoasMatch = text.match(/acquisizione[\s\S]{0,400}?roas[:\s]*([\d.,]+)/i);
        if (acqRoasMatch) {
          const roasNum = parseFloat(acqRoasMatch[1].replace(",", "."));
          if (roasNum > 0) {
            parsed.acq_revenue = Math.round(parsed.acq_spesa * roasNum * 100) / 100;
            parsed.warnings = parsed.warnings || [];
            if (!parsed.warnings.some((w: string) => w.toLowerCase().includes("revenue acquisizione"))) {
              parsed.warnings.push("Revenue acquisizione calcolata da ROAS (backup)");
            }
          }
        }
      }
      // Retargeting
      if (parsed.ret_spesa > 0 && parsed.ret_revenue === 0) {
        const retRoasMatch = text.match(/retargeting[\s\S]{0,400}?roas[:\s]*([\d.,]+)/i);
        if (retRoasMatch) {
          const roasNum = parseFloat(retRoasMatch[1].replace(",", "."));
          if (roasNum > 0) {
            parsed.ret_revenue = Math.round(parsed.ret_spesa * roasNum * 100) / 100;
            parsed.warnings = parsed.warnings || [];
            if (!parsed.warnings.some((w: string) => w.toLowerCase().includes("revenue retargeting"))) {
              parsed.warnings.push("Revenue retargeting calcolata da ROAS (backup)");
            }
          }
        }
      }
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
