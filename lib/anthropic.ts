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

  return `Sei il copy director di Occhiale Matto, brand italiano di occhiali da sole (prezzo €29,99, palette: nero #0a0a0a, giallo #F5D547, rosso #E63946, fonts Bebas Neue + Montserrat).

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
 * Contains all 24 technical rules battle-tested on real Occhiale Matto campaigns.
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

  return `Genera l'email HTML COMPLETA per Occhiale Matto, pronta da incollare su Klaviyo.

SUBJECT: "${chosenSubject}"
PREVIEW TEXT: "${chosenPreview}"
TIPO: ${emailType}
HEADLINE HERO: "${chosenSubject.toUpperCase()}"
STRUTTURA CONSIGLIATA: ${strategy || "Hero + griglia prodotti + CTA"}

PRODOTTI DA INSERIRE:
${productBlocks}

REGOLE TECNICHE OBBLIGATORIE:
1. DARK MODE BLOCK in <head>: <meta name="color-scheme" content="light only"> + CSS :root { color-scheme: light only !important; } + @media (prefers-color-scheme: dark) che ri-forza tutti i colori
2. TUTTI GLI STILI INLINE su ogni td, p, a — niente classi per colori/layout
3. CTA DOPPIA PROTEZIONE: <a style="color:#1a1a1a"><span style="color:#1a1a1a !important;text-decoration:none !important;">TESTO</span></a>
4. FOTO PRODOTTO: height:240px, object-fit:contain, background-color:#ffffff sulla td e img, padding:12px
5. LAYOUT: max-width:480px, width:100% — container dentro wrapper width:100%
6. WRAPPER bgcolor="#1a1a1a" — tutto su sfondo nero
7. COLONNE 2 prodotti affiancati (50/50) che NON si impilano su mobile
8. Font: titoli 'Bebas Neue','Arial Black',Arial,sans-serif — body 'Montserrat',Arial,sans-serif
9. Google Fonts import nel <head> per Bebas Neue e Montserrat
10. LOGO HEADER 180px centrato: https://d3k81ch9hvuctc.cloudfront.net/company/SuvjeA/images/efab9e30-782b-4853-8d7b-d6184c7e3458.png
11. LOGO FOOTER 130px
12. PALETTE: nero #1a1a1a, beige #f0ebe3, beige scuro #e8ddd0, bianco #ffffff
13. Sezioni alternate chiaro/scuro
14. Eyebrow label con letterspacing alto sopra headline
15. Strip feature con icone testo: Spedizione 24/48h · Reso 14gg · UV400 · Custodia inclusa
16. CTA rettangolari sfondo beige #f0ebe3 testo nero #1a1a1a, letterspacing, CAPS
17. FOOTER: logo, 3 negozi Roma (Via Baldo degli Ubaldi 212, Via Tuscolana 487A, CC Euroma 2), social IG @occhiale_matto e TikTok @occhiale_matto_official, unsub link {% unsubscribe %}, "Crazy Fashion Eyewear Since 2019"
18. PREHEADER TEXT nascosto all'inizio del body
19. Ogni immagine prodotto DEVE essere cliccabile (link alla pagina prodotto)
20. Prezzo sotto ogni prodotto
21. Nome modello sotto ogni prodotto in bold
22. role="presentation" su ogni table
23. Media query per mobile: titoli 22px, copy 10px, padding laterale 12px
24. NON usare il trattino al posto della virgola

Genera SOLO il codice HTML completo, da <!DOCTYPE html> a </html>. Nessun testo prima o dopo. Nessun backtick markdown.`;
}
