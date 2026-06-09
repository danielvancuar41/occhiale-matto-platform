import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODELS } from "@/lib/anthropic";
import { getAdminClient, AdvWeek, deriveKPIs } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

type DiagnoseRequest = {
  weekId?: string;        // diagnose a single week
  focus?: string;         // optional user-provided focus (e.g., "perché il CPA è esploso?")
  saveToDb?: boolean;     // if true, persist diagnosis text on the week row
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DiagnoseRequest;
    const supabase = getAdminClient();

    // Load all weeks (we need context — at minimum the target + 3 prior)
    const { data: allWeeks, error } = await supabase
      .from("adv_weeks")
      .select("*")
      .order("week_number", { ascending: true });

    if (error) throw error;
    if (!allWeeks || allWeeks.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nessuna settimana ADV salvata da analizzare" },
        { status: 400 }
      );
    }

    // Pick target week (latest if not specified)
    const target = body.weekId
      ? allWeeks.find((w: AdvWeek) => w.id === body.weekId)
      : allWeeks[allWeeks.length - 1];

    if (!target) {
      return NextResponse.json({ ok: false, error: "Settimana non trovata" }, { status: 404 });
    }

    const targetIdx = allWeeks.findIndex((w: AdvWeek) => w.id === target.id);
    const prior = allWeeks.slice(Math.max(0, targetIdx - 4), targetIdx); // up to 4 prior weeks

    const prompt = buildDiagnosePrompt(target, prior, body.focus);

    const resp = await anthropic.messages.create({
      model: MODELS.strategic,
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }]
    });

    const diagnosis = resp.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    // Save to DB if requested
    if (body.saveToDb !== false) {
      await supabase
        .from("adv_weeks")
        .update({
          ai_diagnosis: diagnosis,
          ai_diagnosis_at: new Date().toISOString()
        })
        .eq("id", target.id);
    }

    return NextResponse.json({
      ok: true,
      diagnosis,
      weekId: target.id,
      diagnosedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[/api/adv/diagnose] error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}

function buildDiagnosePrompt(target: AdvWeek, prior: AdvWeek[], focus?: string): string {
  const fmtWeek = (w: AdvWeek) => {
    const k = deriveKPIs(w);
    return `### Settimana ${w.week_number}${w.week_label ? ` (${w.week_label})` : ""} — ${w.week_start} → ${w.week_end}
ACQUISIZIONE: spesa €${w.acq_spesa.toFixed(2)} | acquisti ${w.acq_acquisti} | revenue €${w.acq_revenue.toFixed(2)} | CPA €${k.acq_cpa.toFixed(2)} | ROAS ${k.acq_roas.toFixed(2)}x${w.acq_impression > 0 ? ` | CTR ${k.acq_ctr.toFixed(2)}% | CPC €${k.acq_cpc.toFixed(2)}` : ""}
RETARGETING:  spesa €${w.ret_spesa.toFixed(2)} | acquisti ${w.ret_acquisti} | revenue €${w.ret_revenue.toFixed(2)} | CPA €${k.ret_cpa.toFixed(2)} | ROAS ${k.ret_roas.toFixed(2)}x${w.ret_impression > 0 ? ` | CTR ${k.ret_ctr.toFixed(2)}% | CPC €${k.ret_cpc.toFixed(2)}` : ""}
TRAFFICO:     spesa €${w.tra_spesa.toFixed(2)} | click ${w.tra_click}${w.tra_impression > 0 ? ` | CTR ${k.tra_ctr.toFixed(2)}% | CPC €${k.tra_cpc.toFixed(2)}` : ""}
TOTALE:       spesa €${k.total_spesa.toFixed(2)} | revenue €${k.total_revenue.toFixed(2)} | acquisti ${k.total_acquisti} | ROAS totale ${k.total_roas.toFixed(2)}x${w.notes ? `
NOTE: ${w.notes}` : ""}`;
  };

  const priorBlock = prior.length > 0
    ? `## SETTIMANE PRECEDENTI (storico per confronto)\n\n${prior.map(fmtWeek).join("\n\n")}\n\n`
    : "## NESSUNA SETTIMANA PRECEDENTE (è la prima)\n\n";

  return `Sei un advertising analyst senior che analizza i report settimanali Meta Ads di Occhiale Matto (e-commerce italiano di occhiali da sole €29,99). Il tuo compito è interpretare i dati e suggerire interventi pratici e specifici.

## CONTESTO BRAND
- Occhiale Matto vende occhiali a €29,99 (margine medio stimato ~40-50%)
- 3 tipologie di campagna Meta: Acquisizione (cold), Retargeting (warm), Traffico (sito)
- Target break-even ROAS acquisizione: 2.0x | ROAS soddisfacente: 3.0x+ | ROAS ottimo: 4.0x+
- Target ROAS retargeting: 4.0x+ (più alto perché audience calda)
- CPA acquisizione sano: sotto €20 | CPA retargeting sano: sotto €15

${priorBlock}## SETTIMANA DA ANALIZZARE (target)

${fmtWeek(target)}

${focus ? `## FOCUS RICHIESTO DALL'UTENTE\n${focus}\n\n` : ""}## OUTPUT RICHIESTO

Produci una diagnosi strutturata in Markdown con QUESTE sezioni esatte (usa proprio i titoli ## indicati):

## 📊 Cosa è successo questa settimana
Riassumi in 3-4 frasi cosa è cambiato rispetto alla settimana precedente. Numeri specifici, non vaghi. Indica le tre cose più importanti (in positivo o negativo).

## 🔍 Perché (interpretazione)
Spiega le cause probabili dei cambiamenti. Sii concreto. Esempi: "il CPA acquisizione è salito perché la spesa è aumentata del X% ma gli acquisti solo del Y% — segnale che il pubblico si sta saturando" oppure "il ROAS retargeting è crollato perché la spesa è esplosa senza che la base di traffico crescesse di pari passo".

## ⚠️ Segnali di allarme
Lista (se presenti) i red flag tecnici:
- ROAS acquisizione sotto 2.0x per più settimane consecutive
- CPA in crescita continua
- Volumi che calano drasticamente
- Retargeting che peggiora invece di migliorare
Se non ci sono allarmi seri, scrivilo chiaramente.

## ✅ Cosa fare (azioni concrete)
Lista 3-5 azioni pratiche e specifiche da implementare nelle prossime 7 giorni. Indica quale campagna toccare e cosa cambiare. Esempi: "tagliare la spesa acquisizione del 30% e riallocare su retargeting", "introdurre nuove creatività perché le attuali stanno saturando", "test budget incrementale su X". Niente consigli generici tipo "ottimizza le campagne".

## 🎯 Cosa monitorare la prossima settimana
2-3 metriche specifiche da tenere d'occhio per capire se le azioni stanno funzionando.

Tono: diretto, professionale, senza fronzoli. Numeri concreti. Niente "potrebbe essere", solo "è" o "non è". Se i dati non bastano per concludere qualcosa, dillo esplicitamente.

Lunghezza totale: massimo 500 parole. Niente preamboli, parti subito con la prima sezione.`;
}
