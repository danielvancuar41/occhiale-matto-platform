import Anthropic from "@anthropic-ai/sdk";
import { formatBrandRulesForPrompt } from "./brand-rules";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[anthropic] ANTHROPIC_API_KEY missing - generation disabled");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "missing"
});

export const MODELS = {
  strategic: "claude-sonnet-4-6",
  fast: "claude-haiku-4-5-20251001"
} as const;

export type Campaign = {
  name: string;
  subject: string;
  sendDate: string;
  weekday: string;
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
  category: string;
  url: string;
  img: string;
  isNew?: boolean;
};

export type TemplateStyle = "classico" | "minimal" | "bold" | "editorial";
export type ColorMode = "light" | "dark";

/**
 * Build the layered prompt for email generation (strategy + subjects).
 */
export function buildEmailPrompt(opts: {
  emailType: string;
  selectedProducts: Product[];
  recentCampaigns: Campaign[];
  topPerformers: Campaign[];
  focus?: string;
  notes?: string;
}) {
  const { emailType, selectedProducts, recentCampaigns, topPerformers, focus, notes } = opts;

  const recentSummary = recentCampaigns
    .slice(0, 8)
    .map(c => `- "${c.subject}" (${c.sendDate}, ${c.weekday}) → OR ${c.openRate.toFixed(1)}%, CR ${c.clickRate.toFixed(2)}%, €${c.revenue.toFixed(0)}, ${c.orders} ordini`)
    .join("\n");

  const topSummary = topPerformers
    .slice(0, 5)
    .map(c => `- "${c.subject}" → CR ${c.clickRate.toFixed(2)}%, €${c.revenue.toFixed(0)}`)
    .join("\n");

  const productList = selectedProducts
    .map(p => `- ${p.name} | €${p.price} | ${p.category}${p.isNew ? " | NUOVO" : ""} | ${p.url} | img: ${p.img}`)
    .join("\n");

  return `Sei il copy director di Occhiale Matto, brand italiano di occhiali da sole (prezzo €29,99, palette: nero #1a1a1a, beige #f0ebe3, fonts Bebas Neue + Montserrat, payoff "Crazy Fashion Eyewear Since 2019").

## TIPO EMAIL RICHIESTO
${emailType}

## CONTESTO STRATEGICO: ultime campagne inviate
${recentSummary}

## PATTERN VINCENTI dallo storico
${topSummary}

## PRODOTTI DA INCLUDERE
${productList}

${focus ? `## FOCUS STRATEGICO\n${focus}\n` : ""}
${notes ? `## NOTE AGGIUNTIVE\n${notes}\n` : ""}

## REGOLE BRAND (non negoziabili)
- Subject: max 35 caratteri, con nome modello noto o hook concreto. Vietate subject vaghe.
- Preview text: 40-80 caratteri, completa la subject, non la ripete.
- Tono: diretto, assertivo, mai scontista. Il brand domina, non il prezzo.
- CTA: sempre doppia protezione (bulletproof button + link testuale).
- HTML: inline styles, dark-mode safe, mobile responsive (max-width 600px).
- Non ripetere tipologie inviate nelle ultime 2 email.

## OUTPUT RICHIESTO
Rispondi SOLO con JSON valido, nessun testo prima o dopo, nessun markdown fence.

{
  "subjects": [
    { "text": "...", "preview": "...", "score": 85, "rationale": "..." },
    { "text": "...", "preview": "...", "score": 82, "rationale": "..." },
    { "text": "...", "preview": "...", "score": 78, "rationale": "..." }
  ],
  "strategy": {
    "recommendedDay": "Tuesday|Thursday|Saturday",
    "emailStructure": "descrizione breve della struttura",
    "hook": "gancio iniziale dell'email",
    "warnings": ["..."]
  }
}`;
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
function getTemplateInstructions(style: TemplateStyle, mode: ColorMode): string {
  switch (style) {
    case "minimal":
      return `### TEMPLATE — MINIMAL (selezionato)
Vibe: pulito, ariato, prodotto-centrico. Spazi ampi, niente decorazioni inutili. Solo le essenziali sezioni.
- Header: IMPORTANTE → il logo OM è BIANCO su PNG trasparente, quindi serve sempre uno sfondo scuro dietro. Soluzione: header con sfondo #1a1a1a a tutta larghezza, logo 140px centrato, padding verticale 36-40px. Il "minimal" si esprime nel resto dell'email, non nell'header (che deve restare scuro per visibilità del logo).
- Hero: solo headline grande (Bebas Neue 56px desktop, 42px mobile) centrata su sfondo neutro chiaro (${mode === "dark" ? "#1a1a1a" : "#faf7f2"}), NESSUNA immagine hero, NESSUN eyebrow. Solo testo nudo. Padding verticale 60-80px.
- Card prodotto: foto grandissima (max-width 320px), nome breve sotto (20px), prezzo accanto al nome o sotto (16px), CTA mini in basso. Card separate da molto whitespace (margin verticale 40px). Foto con object-fit:contain (mai cover).
- NESSUNA sezione decorativa con sfondo a contrasto. Tutto sullo stesso sfondo neutro nel corpo.
- NIENTE quote block, NIENTE strip feature con emoji (la minimalità lo richiede)
- Footer: bg scuro #1a1a1a (per coerenza con header e per il logo bianco), logo 130px, payoff su una riga, 3 negozi su una riga sola con · come separatore, 2 link social testuali in colore chiaro
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
- Header: logo 160px centrato, sotto micro-data "ISSUE 04 — SUMMER 2026" stile rivista (10px letter-spacing 4px)
- Hero: foto grande lifestyle (può essere il primo prodotto), headline in font serif elegante (usa "Playfair Display" via Google Fonts: importa sia Playfair Display 700 sia Bebas Neue sia Montserrat), 56-72px, normal-case, letter-spacing -1px (tight). Sotto la headline una colonna di testo intro 14px line-height 1.8 max-width 480px centrata.
- Card prodotto: layout magazine-like. Una card può essere "full bleed" (foto a tutta larghezza) e quella accanto "ridotta" (foto + testo accanto). Variare leggermente le proporzioni delle card.
- Sezioni con titoli numerati ("01 / EDITORIAL", "02 / NEW IN", "03 / STAFF PICKS") in eyebrow 10px
- Quote block centrale: italic Playfair Display 22-28px in mezzo a una sezione tutta sua, con bordo orizzontale sopra e sotto (1px), firma "— OM" sotto
- CTA finale: bottone testuale con underline e freccia → (no bottone box pieno, solo link grosso 18px), sotto un piccolo "SHOP THE COLLECTION ↗"
- Strip feature: trasformata in righe orizzontali eleganti con icona testuale tipo "FREE SHIPPING / 14-DAY RETURNS / UV400" su una riga sola, font 11px letter-spacing 3px`;
    
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
- Footer completo: logo 130px, payoff, 3 negozi Roma cliccabili, link social testuali, unsubscribe`;
  }
}

/**
 * Build the HTML-generation prompt (step 3).
 * Includes brand-rules hard constraints, template style instructions,
 * color mode palette, and the OM brand DNA.
 */
export function buildHtmlPrompt(opts: {
  chosenSubject: string;
  chosenPreview: string;
  emailType: string;
  selectedProducts: Product[];
  strategy: string;
  templateStyle?: TemplateStyle;
  colorMode?: ColorMode;
}) {
  const {
    chosenSubject,
    chosenPreview,
    emailType,
    selectedProducts,
    strategy,
    templateStyle = "classico",
    colorMode = "light"
  } = opts;

  const FOTO_MODELS = new Set([
    "prime", "ghepard-goccia", "ghepard-rett", "elite", "c-smoke",
    "quebec", "pigalle", "banlieue", "hype-vintage"
  ]);

  const productBlocks = selectedProducts.map(p => `
PRODOTTO: ${p.name}
- Prezzo: €${p.price}
- URL pagina: ${p.url}
- URL immagine: ${p.img}
- Nuovo: ${p.isNew ? "sì" : "no"}
- Fotocromatico: ${FOTO_MODELS.has(p.id) ? "sì" : "no"}`).join("\n");

  const brandRulesBlock = formatBrandRulesForPrompt();
  const paletteBlock = getPaletteForMode(colorMode);
  const templateBlock = getTemplateInstructions(templateStyle, colorMode);

  return `Genera l'email HTML COMPLETA per Occhiale Matto, pronta da incollare su Klaviyo. Segui i VINCOLI INVIOLABILI, il TEMPLATE selezionato, la PALETTE selezionata, e il DNA VISIVO del brand.

${brandRulesBlock}

================================================================
INPUT EMAIL
================================================================
SUBJECT: "${chosenSubject}"
PREVIEW TEXT: "${chosenPreview}"
TIPO: ${emailType}
HEADLINE HERO: "${chosenSubject.toUpperCase().replace(/"/g, "")}"
STRUTTURA CONSIGLIATA: ${strategy || "Hero + griglia prodotti + CTA"}
TEMPLATE SELEZIONATO: ${templateStyle.toUpperCase()}
MODALITÀ COLORE: ${colorMode.toUpperCase()}

PRODOTTI DA INSERIRE:
${productBlocks}

================================================================
CONFIGURAZIONE GRAFICA SELEZIONATA DALL'UTENTE
================================================================

${paletteBlock}

${templateBlock}

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
1. Foto SENZA rettangolo intorno: <td align="center" style="padding:0;line-height:0"> con dentro <a href="URL"><img src="..." style="display:block;width:100%;max-width:280px;height:280px;object-fit:contain;background-color:#ffffff;border:0;outline:none" alt="..."></a>
2. TUTTE le foto prodotto di tutta l'email DEVONO avere width="280" height="280" identici. USA object-fit:CONTAIN (non cover) per NON tagliare la foto. Cover taglierebbe parti dell'occhiale. Contain mantiene la foto intera con eventuale spazio bianco ai lati.
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
- Link {% unsubscribe %} 11px

### DARK MODE TECHNICAL (critico per Gmail/Apple Mail)
- <meta name="color-scheme" content="light only"> (solo se template colorMode = light)
- <meta name="supported-color-schemes" content="light only"> (solo se template colorMode = light)
- Per modalità DARK, lasciare che i client la rispettino naturalmente (siamo già dark)
- @media (prefers-color-scheme: dark): forzare colori critici con !important per evitare override di Gmail

================================================================
REGOLE TECNICHE OBBLIGATORIE
================================================================
1. TUTTI GLI STILI INLINE (tranne media query) su ogni td, p, a, span
2. CTA DOPPIA PROTEZIONE: <a style="color:#...;..."><span style="color:#... !important;text-decoration:none !important;">TESTO</span></a>
3. Tutte le immagini prodotto cliccabili (avvolte in <a href="URL_PRODOTTO">)
4. Layout: max-width 600px, wrapper width 100%
5. role="presentation" su OGNI table
6. Google Fonts import nel <head>: Bebas Neue + Montserrat (e Playfair Display se template EDITORIAL)
7. Logo header: https://d3k81ch9hvuctc.cloudfront.net/company/SuvjeA/images/efab9e30-782b-4853-8d7b-d6184c7e3458.png
8. Se 2+ prodotti affiancati: griglia 2 col mantenuta SU MOBILE (vedi vincoli inviolabili)
9. Prezzo SEMPRE visibile sotto ogni prodotto, ESATTO dal catalog (MAI inventato)
10. Preheader nascosto con testo reale (no "&nbsp;&nbsp;...")
11. Alt text descrittivo REALE su ogni <img>
12. Non usare CSS grid o flex (usa solo table)

================================================================
OUTPUT
================================================================
Genera SOLO il codice HTML completo, da <!DOCTYPE html> a </html>.
Nessun testo prima o dopo. Nessun backtick markdown. Nessuna spiegazione.`;
}
