import Anthropic from "@anthropic-ai/sdk";
import { formatBrandRulesForPrompt } from "./brand-rules";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[anthropic] ANTHROPIC_API_KEY missing - generation disabled");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "missing"
});

/**
 * Modello usato da tutte le chiamate (generatore email + ADV).
 * Si può cambiare da Vercel con ANTHROPIC_MODEL senza toccare il codice.
 */
export const MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-5-5";

export type Effort = "low" | "medium" | "high";

export class ClaudeRefusalError extends Error {}

/**
 * Chiamata unica a Claude, usata da tutte le route:
 * - streaming + finalMessage(): niente timeout HTTP sulle risposte lunghe (HTML)
 * - effort esplicito: su Opus 5.5 il thinking è sempre attivo e l'effort ne regola
 *   profondità, tempi e costo
 * - fallback server-side (beta) se un filtro di sicurezza rifiuta per errore la richiesta
 * - output JSON garantito se passi jsonSchema
 * - system prompt in cache (cacheSystem) quando è lungo e sempre uguale
 * Se l'API risponde 400 (beta non abilitata sull'account, oppure un ANTHROPIC_MODEL
 * che non supporta effort/fallback) ritenta una volta con la richiesta minima.
 */
export async function runClaude(opts: {
  system?: string;
  cacheSystem?: boolean;
  content: string | Anthropic.Beta.BetaContentBlockParam[];
  maxTokens: number;
  effort: Effort;
  jsonSchema?: Record<string, unknown>;
}): Promise<{ text: string; stopReason: string | null }> {
  const system = opts.system
    ? [{
        type: "text" as const,
        text: opts.system,
        ...(opts.cacheSystem ? { cache_control: { type: "ephemeral" as const } } : {})
      }]
    : undefined;
  const format = opts.jsonSchema ? { type: "json_schema" as const, schema: opts.jsonSchema } : undefined;
  const startedAt = Date.now();

  let message: Anthropic.Message | Anthropic.Beta.BetaMessage;
  try {
    message = await anthropic.beta.messages
      .stream({
        model: MODEL,
        max_tokens: opts.maxTokens,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: opts.effort, ...(format ? { format } : {}) },
        ...(system ? { system } : {}),
        messages: [{ role: "user", content: opts.content }]
      })
      .finalMessage();
  } catch (err) {
    if (!(err instanceof Anthropic.BadRequestError)) throw err;
    console.warn(`[anthropic] 400 su ${MODEL} con effort/fallback, ritento con la richiesta minima: ${err.message}`);
    message = await anthropic.messages
      .stream({
        model: MODEL,
        max_tokens: opts.maxTokens,
        ...(format ? { output_config: { format } } : {}),
        ...(system ? { system } : {}),
        messages: [{ role: "user", content: opts.content as Anthropic.MessageParam["content"] }]
      })
      .finalMessage();
  }

  const u = message.usage;
  console.log(
    `[anthropic] ${message.model} effort=${opts.effort} stop=${message.stop_reason} ` +
    `${((Date.now() - startedAt) / 1000).toFixed(0)}s in=${u.input_tokens} out=${u.output_tokens} ` +
    `cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0}`
  );

  if (message.stop_reason === "refusal") {
    throw new ClaudeRefusalError(
      "Claude ha rifiutato la richiesta (filtro di sicurezza). Riformula focus o note e riprova."
    );
  }

  // La risposta può contenere blocchi thinking/fallback: si legge solo il testo.
  const text = message.content
    .map(block => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  return { text, stopReason: message.stop_reason };
}

/** Toglie eventuali ``` e isola l'oggetto JSON anche se c'è testo attorno. */
export function parseJsonLoose(text: string): any {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("JSON non trovato nella risposta");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export type Campaign = {
  name: string;
  subject: string;
  sendDate: string;
  weekday: string;
  type?: string;
  recipients: number;
  opens: number;
  openRate: number;
  clicks: number;
  clickRate: number;
  orders: number;
  revenue: number;
  unsubscribes: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;     // genere: unisex | donna | uomo | "" (dai tag Shopify)
  url: string;
  img: string;
  isNew?: boolean;
  features?: string[];  // caratteristiche verificate (tag Shopify, nome prodotto)
  colors?: string[];    // varianti colore disponibili
  details?: string;     // misure dalla scheda prodotto
  imgW?: number;        // dimensioni originali della foto (servono per ritagliarla)
  imgH?: number;
};

export type TemplateStyle = "classico" | "minimal" | "bold" | "editorial" | "statement";
export type ColorMode = "light" | "dark";
export type StatementPosition = "top" | "bottom" | "both" | "split";

// Logo Occhiale Matto BIANCO su PNG trasparente (per header/footer scuri).
export const OM_LOGO_WHITE = "https://d3k81ch9hvuctc.cloudfront.net/company/SuvjeA/images/efab9e30-782b-4853-8d7b-d6184c7e3458.png";
// Logo Occhiale Matto NERO (per template statement su fondo bianco).
export const OM_LOGO_DARK = "https://d3k81ch9hvuctc.cloudfront.net/company/SuvjeA/images/264a5c95-09ae-4713-835f-a3f31dac4a15.png";

export function formatPrice(price: number): string {
  return `€${Number(price || 0).toFixed(2).replace(".", ",")}`;
}

/** Fotocromatico "pieno" (tag Shopify), non solo una variante colore. */
export function isPhotochromic(p: Product): boolean {
  return (p.features || []).some(f => /^lenti fotocromatiche$/i.test(f));
}

function todayIT(): string {
  return new Date().toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome"
  });
}

/** Etichetta stagione per il template editorial (es. "AUTUMN 2026"). */
function issueLabel(d = new Date()): string {
  const m = d.getMonth();
  const season = m >= 2 && m <= 4 ? "SPRING" : m >= 5 && m <= 7 ? "SUMMER" : m >= 8 && m <= 10 ? "AUTUMN" : "WINTER";
  return `${season} ${d.getFullYear()}`;
}

/** Dati ufficiali di un prodotto, riusati nei prompt strategia e HTML. */
function officialProductData(p: Product, indent = "  "): string {
  const lines: string[] = [];
  if (p.features?.length) lines.push(`${indent}caratteristiche: ${p.features.join(", ")}`);
  if (p.colors?.length) lines.push(`${indent}colori disponibili: ${p.colors.join(", ")}`);
  if (p.details) lines.push(`${indent}misure: ${p.details}`);
  if (!lines.length) lines.push(`${indent}(nessun altro dato ufficiale: non attribuire materiali o caratteristiche)`);
  return lines.join("\n");
}

function campaignLine(c: Campaign): string {
  const per1000 = c.recipients > 0 ? ` (€${((c.revenue / c.recipients) * 1000).toFixed(1)} ogni 1000 destinatari)` : "";
  const type = c.type ? ` [${c.type}]` : "";
  return `- ${c.sendDate}${c.weekday ? ` ${c.weekday}` : ""}${type} "${c.subject}" → OR ${c.openRate.toFixed(1)}%, CR ${c.clickRate.toFixed(2)}%, €${c.revenue.toFixed(0)}${per1000}, ${c.orders} ordini`;
}

/** JSON Schema della risposta strategia (imposto con output_config.format). */
export const STRATEGY_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    subjects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string", description: "Subject line dell'email, max 35 caratteri" },
          statement: { type: "string", description: "Solo template statement: la frase gigante, oppure le due frasi sopra e sotto la foto separate da \" / \". Stringa vuota negli altri template." },
          preview: { type: "string", description: "Preview text, 40-80 caratteri" },
          score: { type: "integer", description: "Efficacia stimata da 0 a 100" },
          rationale: { type: "string" }
        },
        required: ["text", "statement", "preview", "score", "rationale"],
        additionalProperties: false
      }
    },
    strategy: {
      type: "object",
      properties: {
        recommendedDay: { type: "string" },
        emailStructure: { type: "string" },
        hook: { type: "string" },
        warnings: { type: "array", items: { type: "string" } }
      },
      required: ["recommendedDay", "emailStructure", "hook", "warnings"],
      additionalProperties: false
    }
  },
  required: ["subjects", "strategy"],
  additionalProperties: false
};

/**
 * Prompt per la strategia (subject + preview + struttura), step 2 del generatore.
 */
export function buildStrategyPrompt(opts: {
  emailType: string;
  selectedProducts: Product[];
  recentCampaigns: Campaign[];
  topPerformers: Campaign[];
  focus?: string;
  notes?: string;
  templateStyle?: TemplateStyle;
  statementPosition?: StatementPosition;
}): { system: string; user: string } {
  const { emailType, selectedProducts, recentCampaigns, topPerformers, focus, notes, templateStyle = "classico", statementPosition = "top" } = opts;
  const isStatement = templateStyle === "statement";
  const hero = selectedProducts[0];

  const system = `Sei il copy director di Occhiale Matto, brand italiano di occhiali nato a Roma nel 2019. Palette: nero #1a1a1a, beige #f0ebe3, oro #b8924a. Font: Bebas Neue + Montserrat. Payoff: "Crazy Fashion Eyewear Since 2019".

REGOLE BRAND (non negoziabili)
- Subject: max 35 caratteri, con nome modello noto o hook concreto. Vietate subject vaghe. Mai emoji, mai punti esclamativi multipli.
- Preview text: 40-80 caratteri, completa la subject senza ripeterla.
- Tono: diretto, assertivo, urbano, provocatorio. Frasi corte. Dai sempre del tu. Mai aziendalese.
- Mai scontista: il brand domina, non il prezzo. Mai "sconto", "offerta", "promozione" se le note non lo chiedono esplicitamente.
- Ogni modello ha il suo prezzo: se lo citi usa quello esatto indicato.
- Descrivi i prodotti SOLO con i DATI UFFICIALI forniti (caratteristiche, colori, misure). MAI inventare materiali (es. acetato), provenienza (es. "italiano"), tipo di lenti, scarsità ("ultimi pezzi") o altre caratteristiche che non sono nei dati.
- La tipologia email la sceglie l'utente: se coincide con quella delle ultime 2 email inviate, segnalalo nei warnings e differenzia l'angolo creativo.`;

  const recentSummary = recentCampaigns.slice(0, 8).map(campaignLine).join("\n") || "(nessun dato)";
  const topSummary = topPerformers.slice(0, 5).map(campaignLine).join("\n") || "(nessun dato)";
  const productList = selectedProducts
    .map((p, i) => `${i + 1}. ${p.name} — ${formatPrice(p.price)}${p.category ? ` — ${p.category}` : ""}${p.isNew ? " — NUOVO" : ""}\n${officialProductData(p)}`)
    .join("\n");

  const heroPrice = hero ? formatPrice(hero.price) : "€29,99";
  const isPair = statementPosition === "both" || statementPosition === "split";
  const statementFormat =
    statementPosition === "both"
      ? `DUE frasi separate da " / ": prima il GANCIO che sta sopra la foto (max 4 parole), poi la CHIUSURA sotto la foto (max 5 parole) che risponde al gancio. Esempio: "SEMBRA CARO. / Costa ${heroPrice}."`
      : statementPosition === "split"
        ? `UNA frase spezzata in due metà separate da " / ": la prima sta sopra la foto, la seconda sotto (max 4 parole ciascuna). Esempio: "NON È UN OCCHIALE. / È UN CARATTERE."`
        : "la frase gigante stampata nell'email: MAX 4 parole, niente emoji, incisiva (verrà resa maiuscola). Può essere diversa dalla subject.";

  const statementBlock = isStatement
    ? `
## TEMPLATE STATEMENT (IMPORTANTE)
L'email è minimalista: UN solo occhiale grande su fondo bianco e frasi secche giganti. Il protagonista è il prodotto 1 (${hero?.name || "il primo della lista"}).
Dai 4 opzioni. Per ognuna:
- "text" = la SUBJECT della mail (max 35 caratteri, stesse regole delle subject)
- "statement" = ${statementFormat}
${isPair ? `
Regole per le frasi sopra e sotto la foto:
- Sopra = il gancio: si legge prima di vedere l'occhiale, crea attesa o fa un'affermazione forte.
- Sotto = la chiusura: risponde al gancio, lo completa o lo ribalta. Mai la stessa parola sopra e sotto.
- Le frasi chiudono col punto. Il prezzo al massimo una volta, ed è quello esatto del prodotto.
Esempi approvati dal brand (usali come modello e adattali al prodotto, puoi anche riprenderli uguali):
- NUOVO. / E ti sta già bene.
- APPENA ATTERRATO. / ${hero?.name || "Jonny"} è online.
- È TORNATO. / Stavolta non aspettare.
- LO CERCAVI. / Eccolo di nuovo.
- NON SBAGLIA MAI. / ${hero?.name || "Jonny"}. Punto.
- SEMBRA CARO. / Costa ${heroPrice}.
- IL SOLE NON ASPETTA. / Tu nemmeno.
- ESTATE IN VISTA. / Mettila a fuoco.
- NON È UN OCCHIALE. / È un carattere.
- NORMALE, MAI. / Matto, sempre.
- TI GUARDERANNO. / Lasciali fare.
- REGALALO. / O tienilo. Non giudichiamo.
- È SEMPRE LUI. / Il più scelto. Non per caso. (solo se è davvero tra i più venduti)
- LO HANNO TUTTI. / Tu ancora no. (solo se è davvero tra i più venduti)
- SI ADATTANO ALLA LUCE. / Tu no. (solo se il prodotto ha lenti fotocromatiche)
- PRENDI 2. / Paghi 1. Fine. (solo se la promo è nelle note)
` : ""}
Varia il tipo di frase tra le opzioni: il puro nome del modello (es. "${hero?.name || "MODELLO"}"), annuncio (es. "NUOVO", "APPENA ARRIVATO", "TORNATO"), prezzo-ancora (es. "DA ${heroPrice}") solo se ha senso, provocazione urbana OM. Urgenza/scarsità SOLO se indicata nelle note.
`
    : "";

  const user = `Oggi è ${todayIT()}.

## TIPO EMAIL RICHIESTO
${emailType}

## ULTIME CAMPAGNE INVIATE (dalla più recente)
${recentSummary}

## CAMPAGNE MIGLIORI (per revenue ogni 1000 destinatari: le liste hanno dimensioni diverse)
${topSummary}

## PRODOTTI DA INCLUDERE (DATI UFFICIALI dal catalogo)
${productList}
${focus ? `\n## FOCUS STRATEGICO\n${focus}\n` : ""}${notes ? `\n## NOTE AGGIUNTIVE\n${notes}\n` : ""}${statementBlock}
## OUTPUT
Proponi ${isStatement ? 4 : 3} opzioni diverse tra loro, nel formato JSON richiesto:
- text: subject line (max 35 caratteri)
- statement: ${isStatement ? (isPair ? 'le due frasi separate da " / "' : "la frase gigante (max 4 parole)") : 'stringa vuota ""'}
- preview: preview text (40-80 caratteri)
- score: efficacia stimata 0-100, coerente con i dati storici
- rationale: perché funziona, in 1-2 frasi, citando i dati storici quando utile
- strategy.recommendedDay: giorno di invio consigliato, in italiano (es. "Giovedì")
- strategy.emailStructure: struttura dell'email in 1-3 frasi
- strategy.hook: gancio iniziale dell'email
- strategy.warnings: attenzioni o rischi (lista vuota se non ce ne sono)`;

  return { system, user };
}

/**
 * Returns the palette and styling instructions for a given color mode.
 */
function getPaletteForMode(mode: ColorMode): string {
  if (mode === "dark") {
    return `### PALETTE — MODALITÀ SCURA (selezionata)
- Sfondo email principale: #1a1a1a (nero profondo)
- Sfondo sezioni alternate: #2a2a2a (grigio molto scuro) per spezzare la monotonia
- Testo principale: #faf7f2 (crema chiara)
- Testo secondario / payoff / micro: #b0b0b0 (grigio chiaro)
- Accent oro: #b8924a (signature OM, identico in entrambe le modalità)
- Bordi divisori: #3a3a3a (grigio scuro sottile)
- CTA bottone: bg #b8924a (oro), testo #1a1a1a (nero)
- Card prodotto: sfondo #2a2a2a, nome prodotto #faf7f2, prezzo #b8924a
- Foto prodotto: nessuno sfondo bianco intorno (le foto rimangono nel loro contenuto naturale, il <td> ha lo stesso bg della sezione, senza padding decorativo)`;
  }
  return `### PALETTE — MODALITÀ CHIARA (selezionata)
- Sfondo email principale: #faf7f2 (crema chiara)
- Sfondo sezioni alternate: #f0ebe3 (beige) o #e8ddd0 (beige scuro) per spezzare la monotonia
- Testo principale: #1a1a1a (nero)
- Testo secondario / payoff / micro: #6a6a6a (grigio medio)
- Accent oro: #b8924a (signature OM, identico in entrambe le modalità)
- Bordi divisori: #e8ddd0 (beige scuro sottile)
- CTA bottone: bg #1a1a1a (nero), testo #faf7f2 (crema)
- Card prodotto: sfondo #ffffff o #faf7f2, nome prodotto #1a1a1a, prezzo #b8924a
- Foto prodotto: nessuno sfondo bianco/rettangolo intorno (le foto rimangono nel loro contenuto naturale)`;
}

/**
 * Returns the visual structure instructions for a given template style.
 */
function getTemplateInstructions(
  style: TemplateStyle,
  mode: ColorMode,
  statementPosition: StatementPosition = "top",
  heroCropped = false
): string {
  const buildStatementPositionBlock = (): string => {
    switch (statementPosition) {
      case "bottom":
        return "TESTO SOTTO. Ordine: [logo] → [foto] → [eyebrow facoltativo, es. il nome del modello] → [FRASE PRINCIPALE] → [riga prezzo: solo il prezzo se il nome è già nell'eyebrow] → [bottone CTA] → [footer]. NIENTE testo sopra la foto.";
      case "both":
        return "SOPRA + SOTTO (gancio e chiusura). Ordine: [logo] → [FRASE SOPRA, grande] → [foto] → [FRASE SOTTO: Bebas Neue UPPERCASE nero, circa metà della dimensione della frase sopra, es. 30-36px desktop / 22-26px mobile] → [riga NOME · PREZZO, oppure solo il NOME se la frase sotto contiene già il prezzo] → [bottone CTA] → [footer]. La frase sotto risponde a quella sopra (la completa o la ribalta): non ripeterla e non usare la stessa parola. Esempi: \"SEMBRA CARO.\" / \"COSTA €29,99.\" · \"IL SOLE NON ASPETTA.\" / \"TU NEMMENO.\" · \"TI GUARDERANNO.\" / \"LASCIALI FARE.\"";
      case "split":
        return "FRASE SPEZZATA. Ordine: [logo] → [PRIMA METÀ della frase, grande] → [foto] → [SECONDA METÀ, stessa dimensione e stesso stile della prima] → [riga NOME · PREZZO] → [bottone CTA] → [footer]. Le due metà sono un'unica frase che abbraccia l'occhiale (es. \"NON È UN OCCHIALE.\" sopra, \"È UN CARATTERE.\" sotto).";
      case "top":
      default:
        return "TESTO SOPRA (come le drop classiche). Ordine: [logo] → [eyebrow facoltativo, es. NUOVO ARRIVO] → [FRASE PRINCIPALE] → [foto] → [riga NOME · PREZZO] → [bottone CTA] → [footer]. Sotto la foto solo la riga nome·prezzo e il bottone.";
    }
  };

  const heroPhotoSpec = heroCropped
    ? "la foto arriva GIÀ RITAGLIATA in orizzontale: l'occhiale riempie la larghezza e il bianco sopra e sotto è già stato tolto. Usa <img src=\"{{IMG_0}}\" width=\"520\" alt=\"...\" style=\"display:block;width:100%;max-width:520px;height:auto;border:0;margin:0 auto\">, centrata e cliccabile (avvolta in <a href=\"{{URL_0}}\">)."
    : "usa <img src=\"{{IMG_0}}\" width=\"440\" alt=\"...\" style=\"display:block;width:100%;max-width:440px;height:auto;border:0;margin:0 auto\">, centrata e cliccabile (avvolta in <a href=\"{{URL_0}}\">).";

  switch (style) {
    case "minimal":
      return `### TEMPLATE — MINIMAL (selezionato)
Vibe: pulito, ariato, prodotto-centrico. Spazi ampi, niente decorazioni inutili. Solo le essenziali sezioni.
- Header: IMPORTANTE → il logo OM è BIANCO su PNG trasparente, quindi serve sempre uno sfondo scuro dietro. Soluzione: header con sfondo #1a1a1a a tutta larghezza, logo 140px centrato, padding verticale 36-40px. Il "minimal" si esprime nel resto dell'email, non nell'header (che deve restare scuro per visibilità del logo).
- Hero: solo headline grande (Bebas Neue 56px desktop, 42px mobile) centrata su sfondo neutro chiaro (${mode === "dark" ? "#1a1a1a" : "#faf7f2"}), NESSUNA immagine hero, NESSUN eyebrow. Solo testo nudo. Padding verticale 60-80px.
- Card prodotto: foto grandissima (max-width 320px), nome breve sotto (20px), prezzo accanto al nome o sotto (16px), CTA mini in basso. Card separate da molto whitespace (margin verticale 40px). Foto con object-fit:contain (mai cover).
- NESSUNA sezione decorativa con sfondo a contrasto. Tutto sullo stesso sfondo neutro nel corpo.
- NIENTE quote block, NIENTE strip feature con emoji (la minimalità lo richiede)
- Footer: bg scuro #1a1a1a (per coerenza con header e per il logo bianco), logo 130px, payoff su una riga, 3 negozi su una riga sola con · come separatore, 2 link social testuali in colore chiaro, link di disiscrizione
- CTA finale: bottone outline (border 1.5px solid, sfondo trasparente) più sottile e elegante`;

    case "bold":
      return `### TEMPLATE — BOLD (selezionato)
Vibe: drop, urgenza, statement. Tipografia gigantesca, contrasti forti, alta energia.
- Header: logo 180px su nero pieno, padding 20-24px
- Hero: BLOCCO PIENO ${mode === "dark" ? "#b8924a (oro)" : "#1a1a1a (nero)"} alto 280px+, headline UPPERCASE Bebas Neue 88-110px desktop / 64-72px mobile, letter-spacing 4-6px, color in alto contrasto. Eyebrow sopra in 12px letter-spacing 8px. Frase impatto sotto (max 12 parole).
- Sezioni con sfondi alternati FORTI (mai pastello, sempre saturazioni piene)
- Card prodotto: foto su sfondo accent (oro o scuro saturato), nome prodotto sotto 32px UPPERCASE, prezzo gigantesco 24-28px bold, CTA pieno wide.
- Numerosi divisori orizzontali pieni 2px alti tra le sezioni
- CTA finale: bottone padding 20px 60px, font 16-18px letter-spacing 4px, full-width o 80% larghezza
- Strip feature: 4 colonne con emoji grandi 32px + testo sotto 11px UPPERCASE`;

    case "editorial":
      return `### TEMPLATE — EDITORIAL (selezionato)
Vibe: magazine, fashion, raffinato. Tipografia mista serif/sans, layout più asimmetrico, sensazione di rivista.
- Header: logo 160px centrato, sotto micro-data "ISSUE — ${issueLabel()}" stile rivista (10px letter-spacing 4px).
- Hero: foto grande lifestyle (può essere il primo prodotto), headline in font serif elegante (usa "Playfair Display" via Google Fonts: importa sia Playfair Display 700 sia Bebas Neue sia Montserrat), 56-72px, normal-case, letter-spacing -1px (tight). Sotto la headline una colonna di testo intro 14px line-height 1.8 max-width 480px centrata.
- Card prodotto: layout magazine-like. Una card può essere "full bleed" (foto a tutta larghezza) e quella accanto "ridotta" (foto + testo accanto). Variare leggermente le proporzioni delle card.
- Sezioni con titoli numerati ("01 / EDITORIAL", "02 / NEW IN", "03 / STAFF PICKS") in eyebrow 10px
- Quote block centrale: italic Playfair Display 22-28px in mezzo a una sezione tutta sua, con bordo orizzontale sopra e sotto (1px), firma "— OM" sotto
- CTA finale: bottone testuale con underline e freccia → (no bottone box pieno, solo link grosso 18px), sotto un piccolo "SHOP THE COLLECTION ↗"
- Strip feature: trasformata in righe orizzontali eleganti con icona testuale tipo "FREE SHIPPING / 14-DAY RETURNS / UV400" su una riga sola, font 11px letter-spacing 3px`;

    case "statement":
      return `### TEMPLATE — STATEMENT (selezionato)
Vibe: minimalismo assoluto, prodotto-eroe. UN solo occhiale grande, frasi secche, sfondo BIANCO. Zero rumore: tutto sul prodotto e sul messaggio. Questo template IGNORA la modalità colore: è SEMPRE su sfondo bianco.

REGOLE STRUTTURALI FISSE (questo template sovrascrive palette e sezioni alternate):
- SFONDO: tutta l'email su bianco #ffffff, HEADER E FOOTER INCLUSI. NESSUNA sezione scura, NESSUN blocco nero da nessuna parte (tranne il bottone CTA).
- HEADER: SOLO il logo immagine Occhiale Matto NERO su bianco, con src il placeholder {{LOGO}} (verrà sostituito con il logo nero). MAI scrivere "OCCHIALE MATTO" come testo, né al posto del logo né accanto. Larghezza 150px, centrato, padding-top 28px, padding-bottom 16px. Nessuna striscia nera dietro.
- UN SOLO PRODOTTO (mono-prodotto): usa esclusivamente il primo prodotto della lista. Se ne arrivano più di uno, ignora gli altri.
- FOTO OCCHIALE: ${heroPhotoSpec} NON impostare height né object-fit e non aggiungere padding attorno alla foto. Questa foto NON segue la ricetta CARD PRODOTTO 280x280.
- FRASE PRINCIPALE (lo statement): Bebas Neue UPPERCASE, nero #1a1a1a, centrata, line-height 0.95. È il cuore dell'email: il testo è quello fornito in input.
  DIMENSIONE (la frase NON deve MAI sbordare oltre i lati):
  * fino a ~12 caratteri (es. "NUOVO", "SEMBRA CARO."): 60-72px desktop / 40-48px mobile
  * 13-24 caratteri: 44-54px desktop / 32-38px mobile
  * 25+ caratteri: 32-40px desktop / 26-32px mobile
  Contenitore max-width 600px con padding laterale 24px e word-wrap:break-word: meglio andare a capo che sforare. Se la frase ha più segmenti separati da punto (es. "JONNY. €29,99. FINITO."), un segmento per riga, righe centrate e bilanciate.
- EYEBROW (micro-testo, es. "NUOVO ARRIVO"): Montserrat 10px, letter-spacing 3px, UPPERCASE, grigio #6a6a6a, centrato, 6px sopra la frase. Facoltativo: usalo solo se aggiunge un'informazione e non ripete la frase.
- RIGA NOME · PREZZO: una sola riga "NOME · PREZZO" (es. "JONNY · €29,99"), Montserrat 12px, letter-spacing 3px, UPPERCASE, #1a1a1a, centrata. Niente prezzi giganti, niente cartellini. Il prezzo compare UNA SOLA VOLTA in tutta l'email: se una frase lo contiene già, qui scrivi solo il nome.
- SPAZI (CRITICO, le frasi devono stare VICINE all'occhiale): 12px tra la frase e la foto, 12px tra la foto e il testo sotto, 20px tra la riga nome·prezzo e il bottone. Mai spazi vuoti grandi tra testo e foto.
- CTA: UN SOLO bottone a pillola (border-radius:999px), sfondo nero #1a1a1a, testo bianco #ffffff, padding 14px 40px, Montserrat 13px bold letter-spacing 2px UPPERCASE, centrato, verso l'URL prodotto. Testo breve e assertivo (LO VOGLIO, PRENDILO, È MIO, SCOPRILO). Doppia protezione colore (span interno con !important).
- NIENTE strip feature emoji, NIENTE quote block, NIENTE altre sezioni prodotto. Il minimalismo è la regola.
- FOOTER — INVERTITO (bianco): sfondo BIANCO #ffffff, testo NERO. Usa il logo NERO come src del placeholder {{LOGO}} (stesso logo nero dell'header) a 120px, NON quello bianco. Payoff "CRAZY FASHION EYEWEAR SINCE 2019" in nero/grigio scuro #1a1a1a, 3 negozi Roma cliccabili in #1a1a1a, link social testuali in #1a1a1a ("SEGUICI SU INSTAGRAM →" / "SEGUICI SU TIKTOK →"), link di disiscrizione in grigio #6a6a6a. Una sottile linea divisoria #e8ddd0 in cima al footer per separarlo dal corpo. TUTTO su bianco, coerente col resto.

POSIZIONE DEL TESTO — CONFIGURAZIONE: ${buildStatementPositionBlock()}

IMPORTANTE: questo template è l'ECCEZIONE alla regola "logo sempre su sfondo scuro". Qui il logo (header E footer) è quello NERO su bianco. NON applicare la striscia nera dietro il logo in nessun punto.

Risultato: email pulitissima, tutta bianca, logo nero, frasi secche vicine all'occhiale, riga nome·prezzo discreta, un bottone. Massimo impatto, minimo rumore.`;

    case "classico":
    default:
      return `### TEMPLATE — CLASSICO (selezionato, default Occhiale Matto)
Vibe: l'identità storica di Occhiale Matto. Quello che hanno funzionato meglio nei test storici.
- Header: logo 180px centrato su #1a1a1a, padding verticale 28px
- Hero: eyebrow piccolo (10-11px letter-spacing 4-6px UPPERCASE) sopra headline Bebas Neue 56-72px UPPERCASE letter-spacing 2-4px
- Sezioni alternate: scuro #1a1a1a → chiaro (${mode === "dark" ? "#2a2a2a" : "#f0ebe3"}) → scuro
- Card prodotto: foto pulita (NO rettangolo bianco intorno), sotto blocco con nome + prezzo + CTA. CTA varia tra card: LO VOGLIO / PRENDILO / SCOPRILO / È MIO.
- Quote block: border-left 3px solid accent, padding-left 20px, italic 16-18px, chiuso con "— OM"
- Strip feature: 4 colonne con emoji + microtesto: 🚚 24/48h · 🔄 Reso 14gg · ☀️ UV400 · 📦 Custodia
- CTA finale: bottone pieno padding 14px 32px letter-spacing 2px
- Footer completo: logo 130px, payoff, 3 negozi Roma cliccabili, link social testuali, link di disiscrizione`;
  }
}

/**
 * Parte fissa del prompt HTML: regole brand, DNA visivo, regole tecniche.
 * È identica per ogni email, quindi va nel system prompt con la cache attiva.
 */
function buildHtmlSystemPrompt(): string {
  return `Sei l'email developer di Occhiale Matto. Generi l'email HTML COMPLETA, pronta da incollare su Klaviyo. Segui i VINCOLI INVIOLABILI, il TEMPLATE e la PALETTE indicati nella richiesta, e il DNA VISIVO del brand.

${formatBrandRulesForPrompt()}

================================================================
DNA VISIVO OCCHIALE MATTO (pattern estratti da campagne con CR > 1.2%)
================================================================

### TIPOGRAFIA
- Headline hero: Bebas Neue (dimensioni variano per template)
- Eyebrow (microtesto sopra headline): 10-11px, letter-spacing 4-6px, UPPERCASE, bold 700
- Body copy: Montserrat 14-16px line-height 1.5-1.7
- CTA: Montserrat 12-13px, letter-spacing 2-3px, UPPERCASE, bold 700
- (Solo per template EDITORIAL: anche Playfair Display 700 per le headline serif)

### CARD PRODOTTO — RICETTA HARD
1. Foto SENZA rettangolo intorno: <td align="center" style="padding:0;line-height:0"> con dentro <a href="{{URL_n}}"><img src="{{IMG_n}}" style="display:block;width:100%;max-width:280px;height:280px;object-fit:contain;background-color:transparent;border:0;outline:none" alt="..."></a>
2. TUTTE le foto prodotto di tutta l'email DEVONO avere width="280" height="280" identici. USA object-fit:CONTAIN (non cover) per NON tagliare la foto. Cover taglierebbe parti dell'occhiale. Contain mantiene la foto intera. Il background-color DEVE essere TRANSPARENT (mai #ffffff), altrimenti compare un rettangolo bianco intorno alla foto.
3. Sotto la foto: blocco con nome prodotto + prezzo + CTA, tutto CENTRATO (align="center" + text-align:center)
4. CTA varia tra card diverse (LO VOGLIO, PRENDILO, SCOPRILO, È MIO)
5. Su mobile NON si stacca: rimane 2 prodotti per riga sempre.

### FOOTER OBBLIGATORIO
- Logo Occhiale Matto 130px centrato
- Payoff "CRAZY FASHION EYEWEAR SINCE 2019" (letter-spacing 3px, 10px)
- 3 negozi Roma cliccabili (link Google Maps):
  * Via Baldo degli Ubaldi 212
  * Via Tuscolana 487A
  * CC Euroma 2
- Link social TESTUALI PULITI:
  * SEGUICI SU INSTAGRAM → (https://www.instagram.com/occhiale_matto)
  * SEGUICI SU TIKTOK → (https://www.tiktok.com/@occhiale_matto_official)
- Link di disiscrizione 11px, ESATTAMENTE in questa forma: <a href="{% unsubscribe_link %}" style="...">Disiscriviti</a>  (MAI {% unsubscribe %} dentro un href)

### DARK MODE TECHNICAL (critico per Gmail/Apple Mail)
- <meta name="color-scheme" content="light only"> (solo se modalità colore = light)
- <meta name="supported-color-schemes" content="light only"> (solo se modalità colore = light)
- Per modalità DARK, lasciare che i client la rispettino naturalmente (siamo già dark)
- @media (prefers-color-scheme: dark): forzare colori critici con !important per evitare override di Gmail

================================================================
REGOLE TECNICHE OBBLIGATORIE
================================================================
0. PLACEHOLDER URL — REGOLA ASSOLUTA: per ogni prodotto usa ESATTAMENTE i placeholder forniti, copiati carattere per carattere SENZA modificarli. Per il src dell'immagine usa {{IMG_0}} (secondo prodotto {{IMG_1}}, ecc.). Per l'href della pagina prodotto usa {{URL_0}} ({{URL_1}}, ecc.). Esempio: <a href="{{URL_0}}"><img src="{{IMG_0}}" alt="..."></a>. NON scrivere URL reali, NON inventare URL, NON ricopiare link da altre fonti: SOLO i placeholder. Verranno sostituiti automaticamente dopo la generazione con gli URL esatti. Se scrivi un URL vero invece del placeholder, l'immagine si romperà.
1. TUTTI GLI STILI INLINE (tranne media query) su ogni td, p, a, span
2. CTA DOPPIA PROTEZIONE: <a style="color:#...;..."><span style="color:#... !important;text-decoration:none !important;">TESTO</span></a>
3. Tutte le immagini prodotto cliccabili (avvolte in <a href="{{URL_n}}">)
4. Layout: max-width 600px, wrapper width 100%
5. role="presentation" su OGNI table
6. Google Fonts import nel <head>: Bebas Neue + Montserrat (e Playfair Display se template EDITORIAL)
7. Logo (header e footer): usa il placeholder {{LOGO}} come src (verrà sostituito con l'URL corretto)
8. Se 2+ prodotti affiancati: griglia 2 col mantenuta SU MOBILE (vedi vincoli inviolabili)
9. Prezzo SEMPRE visibile sotto ogni prodotto, ESATTO dal catalog (MAI inventato)
10. Preheader nascosto con il PREVIEW TEXT reale (no "&nbsp;&nbsp;...")
11. Alt text descrittivo REALE su ogni <img>, basato solo sui dati ufficiali del prodotto
12. Non usare CSS grid o flex (usa solo table)

================================================================
OUTPUT
================================================================
Genera SOLO il codice HTML completo, da <!DOCTYPE html> a </html>.
Nessun testo prima o dopo. Nessun backtick markdown. Nessuna spiegazione.`;
}

/**
 * Prompt per l'HTML (step 3): system fisso in cache + richiesta con i dati variabili.
 */
const cleanHeadline = (s: string) => s.toUpperCase().replace(/"/g, "").trim();

/**
 * Frasi del template Statement. Con "Sopra + sotto" e "Frase spezzata" le due frasi
 * arrivano separate da "/" (es. "SEMBRA CARO. / COSTA €29,99.").
 */
function statementCopy(raw: string, position: StatementPosition): string {
  const [first, ...rest] = raw.split("/");
  const second = rest.join(" ").trim();
  if (position === "both" || position === "split") {
    if (second) {
      return `FRASE SOPRA LA FOTO: "${cleanHeadline(first)}"\nFRASE SOTTO LA FOTO: "${cleanHeadline(second)}"`;
    }
    return position === "split"
      ? `FRASE DA SPEZZARE (metà sopra e metà sotto la foto, taglia alla pausa naturale): "${cleanHeadline(first)}"`
      : `FRASE SOPRA LA FOTO: "${cleanHeadline(first)}"\nFRASE SOTTO LA FOTO: scrivila tu, max 5 parole, che risponda alla frase sopra`;
  }
  return `HEADLINE HERO: "${cleanHeadline(raw.replace(/\s*\/\s*/g, " "))}"`;
}

export function buildHtmlPrompt(opts: {
  chosenSubject: string;
  chosenPreview: string;
  chosenStatement?: string;
  emailType: string;
  selectedProducts: Product[];
  strategy: string;
  templateStyle?: TemplateStyle;
  colorMode?: ColorMode;
  statementPosition?: StatementPosition;
  heroCropped?: boolean;
}): { system: string; user: string } {
  const {
    chosenSubject,
    chosenPreview,
    chosenStatement,
    emailType,
    selectedProducts,
    strategy,
    templateStyle = "classico",
    statementPosition = "top",
    heroCropped = false
  } = opts;

  // Il template statement è SEMPRE su fondo bianco: ignora il colorMode scelto.
  const colorMode: ColorMode = templateStyle === "statement" ? "light" : (opts.colorMode || "light");
  const headline = (templateStyle === "statement" && chosenStatement?.trim()) ? chosenStatement : chosenSubject;
  const headlineBlock = templateStyle === "statement"
    ? statementCopy(headline, statementPosition)
    : `HEADLINE HERO: "${cleanHeadline(headline)}"`;

  const productBlocks = selectedProducts.map((p, i) => `
PRODOTTO ${i + 1}: ${p.name}
- Prezzo: ${formatPrice(p.price)}
- URL pagina: {{URL_${i}}}
- URL immagine: {{IMG_${i}}}
- Nuovo: ${p.isNew ? "sì" : "no"}
- Fotocromatico: ${isPhotochromic(p) ? "sì" : "no"}
- Dati ufficiali:
${officialProductData(p, "    ")}`).join("\n");

  const user = `================================================================
INPUT EMAIL
================================================================
SUBJECT: "${chosenSubject}"
PREVIEW TEXT: "${chosenPreview}"
TIPO: ${emailType}
${headlineBlock}
STRUTTURA CONSIGLIATA: ${strategy || "Hero + griglia prodotti + CTA"}
TEMPLATE SELEZIONATO: ${templateStyle.toUpperCase()}
MODALITÀ COLORE: ${colorMode.toUpperCase()}

PRODOTTI DA INSERIRE:
${productBlocks}

================================================================
CONFIGURAZIONE GRAFICA SELEZIONATA DALL'UTENTE
================================================================

${getPaletteForMode(colorMode)}

${getTemplateInstructions(templateStyle, colorMode, statementPosition, heroCropped)}`;

  return { system: buildHtmlSystemPrompt(), user };
}
