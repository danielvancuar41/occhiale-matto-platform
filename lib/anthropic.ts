import Anthropic from "@anthropic-ai/sdk";

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

/**
 * Build the layered prompt for email generation.
 * Layer 1: brand rules (permanent)
 * Layer 2: recent campaign performance
 * Layer 3: editorial rotation context
 * Layer 4: product catalog
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
 * Build the HTML-generation prompt (step 3).
 * Contains the Occhiale Matto brand DNA extracted from 3 reference campaigns
 * that achieved top CR/OR in Q1 2026.
 */
export function buildHtmlPrompt(opts: {
  chosenSubject: string;
  chosenPreview: string;
  emailType: string;
  selectedProducts: Product[];
  strategy: string;
}) {
  const { chosenSubject, chosenPreview, emailType, selectedProducts, strategy } = opts;

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

  return `Genera l'email HTML COMPLETA per Occhiale Matto, pronta da incollare su Klaviyo. Segui il DNA VISIVO del brand estratto da 3 campagne storiche vincenti.

================================================================
INPUT EMAIL
================================================================
SUBJECT: "${chosenSubject}"
PREVIEW TEXT: "${chosenPreview}"
TIPO: ${emailType}
HEADLINE HERO: "${chosenSubject.toUpperCase().replace(/"/g, "")}"
STRUTTURA CONSIGLIATA: ${strategy || "Hero + griglia prodotti + CTA"}

PRODOTTI DA INSERIRE:
${productBlocks}

================================================================
DNA VISIVO OCCHIALE MATTO (pattern estratti da campagne con CR > 1.2%)
================================================================

### PALETTE FISSA (mai modificare)
- Nero principale: #1a1a1a
- Beige chiaro: #f0ebe3
- Beige scuro: #e8ddd0
- Bianco foto: #ffffff
- Grigio secondario testo su beige: #b0b0b0
- Accenti: solo in sezioni specifiche, mai più di 2 colori extra

### TIPOGRAFIA
- Headline hero: Bebas Neue 48-72px desktop / 42-56px mobile, letter-spacing 2-4px, UPPERCASE
- Eyebrow (microtesto sopra headline): 10-11px, letter-spacing 4-6px, UPPERCASE, bold 700, color #1a1a1a su beige oppure #f0ebe3 su nero
- Body copy: Montserrat 14-16px line-height 1.5-1.7
- CTA: Montserrat 12-13px, letter-spacing 2-3px, UPPERCASE, bold 700

### STRUTTURA SEZIONI (ordine tipico di un'email OM)
1. Preheader nascosto (visibility:hidden, altezza 0)
2. Header: logo 180px centrato, padding verticale 24-32px, bg #1a1a1a
3. Hero: full-width con eyebrow + headline + (opzionale) immagine prodotto o lifestyle
4. Sezioni alternate: una scura (#1a1a1a) → una chiara (#f0ebe3 o #e8ddd0) → una scura
5. Card prodotto: foto su bg #ffffff (padding 16-24px) SOPRA un blocco scuro #1a1a1a con nome + prezzo + CTA
6. Quote block (opzionale): border-left 3px solid #f0ebe3, padding-left 20px, italic, 16-18px
7. Strip feature: 3-4 colonne con emoji + microtesto (es: 🚚 24/48h · 🔄 Reso 14gg · ☀️ UV400 · 📦 Custodia)
8. CTA finale centrale prominente
9. Footer

### CARD PRODOTTO (pattern vincente testato)
- Contenitore con width 100% o 50% se affiancati
- Foto: bg #ffffff, height 240px, object-fit contain, padding interno 16-20px
- Sotto la foto: blocco bg #1a1a1a padding 24px contenente:
  - Eyebrow "MODELLO" o categoria (10px, letter-spacing 3px, color #f0ebe3, margin-bottom 8px)
  - Nome modello (Bebas Neue 24-28px, color #ffffff, uppercase, margin-bottom 6px)
  - Prezzo (Montserrat 14px bold, color #f0ebe3, margin-bottom 16px)
  - CTA bottone bg #f0ebe3 color #1a1a1a padding 12px 24px letter-spacing 2px

### FOOTER OBBLIGATORIO (replicato esatto)
- bg #1a1a1a, padding 40px top 32px bottom
- Logo Occhiale Matto 130px centrato
- 3 negozi Roma cliccabili (link Google Maps):
  * Via Baldo degli Ubaldi 212
  * Via Tuscolana 487A
  * CC Euroma 2
  (formato: nome negozio su riga, indirizzo riga sotto, 12px, color #b0b0b0)
- Icone social IG e TikTok (@occhiale_matto su IG, @occhiale_matto_official su TikTok) 24px
- Tagline "CRAZY FASHION EYEWEAR SINCE 2019" (letter-spacing 3px, 10px, color #f0ebe3)
- Link {% unsubscribe %} 11px color #888
- Indirizzo legale a fondo pagina 10px color #666

### DARK MODE (critico per Gmail/Apple Mail)
- <meta name="color-scheme" content="light only">
- <meta name="supported-color-schemes" content="light only">
- <style> :root { color-scheme: light only !important; } </style>
- @media (prefers-color-scheme: dark) { ogni colore critico va ri-forzato con !important }

================================================================
REGOLE TECNICHE OBBLIGATORIE
================================================================
1. TUTTI GLI STILI INLINE (tranne media query) su ogni td, p, a, span
2. CTA DOPPIA PROTEZIONE: <a style="color:#1a1a1a;..."><span style="color:#1a1a1a !important;text-decoration:none !important;">TESTO</span></a>
3. Tutte le immagini prodotto cliccabili (avvolte in <a href="URL_PRODOTTO">)
4. Layout: max-width 600px, wrapper width 100%
5. role="presentation" su OGNI table
6. Google Fonts import nel <head>: Bebas Neue + Montserrat
7. Logo header: https://d3k81ch9hvuctc.cloudfront.net/company/SuvjeA/images/efab9e30-782b-4853-8d7b-d6184c7e3458.png
8. Se 2 prodotti affiancati: NON devono impilarsi su mobile se possibile (usa table con 2 td al 50%)
9. Se 3-4 prodotti: griglia 2x2 o 1x3 a tua scelta in base al tipo email
10. Prezzo SEMPRE visibile sotto ogni prodotto
11. Preheader nascosto con testo reale (no "&nbsp;&nbsp;...")
12. Media query mobile: headline ridotta, padding laterale 16-20px, font body 13-14px
13. MAI trattini al posto di virgole
14. MAI emoji nel subject (emoji SÌ nelle strip feature e body)
15. CTA principale: sempre 1 per prodotto + 1 finale centrale
16. Bottone bulletproof VML per Outlook opzionale ma apprezzato
17. Alt text descrittivo su ogni <img>
18. Non usare CSS grid o flex (supporto email client limitato, usa solo table)

================================================================
STRUTTURA TIPICA PER NUMERO PRODOTTI
================================================================
- 1 prodotto (hero product): hero full-width con foto grande + headline + CTA → quote block → strip feature → footer
- 2 prodotti (duo confronto): hero headline → card prodotti affiancati 50/50 → CTA centrale → strip feature → footer
- 3-4 prodotti (griglia): hero headline → griglia 2x2 card → CTA centrale → strip feature → footer
- 5+ prodotti (collezione): hero headline → sezione "scopri la collezione" → preview 4 card principali → CTA "vedi tutti" → footer

================================================================
OUTPUT
================================================================
Genera SOLO il codice HTML completo, da <!DOCTYPE html> a </html>.
Nessun testo prima o dopo. Nessun backtick markdown. Nessuna spiegazione.`;
}
