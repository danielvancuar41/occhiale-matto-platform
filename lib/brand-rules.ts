/**
 * BRAND RULES & CORREZIONI VINCOLANTI per Occhiale Matto
 *
 * Questo file contiene tutte le regole estratte dall'esperienza reale di Pier
 * sulle email generate dalla piattaforma. Ogni volta che si identifica un errore
 * ricorrente di Claude, la correzione va aggiunta qui.
 *
 * Il contenuto di BRAND_RULES viene automaticamente iniettato nel prompt HTML
 * ad ogni generazione (vedi buildHtmlPrompt in anthropic.ts).
 *
 * Come aggiungere una nuova regola:
 * 1. Aggiungi la regola come stringa nel corrispondente gruppo tematico
 * 2. Commit su GitHub
 * 3. Da quel momento ogni email generata rispetterà la nuova regola
 */

export const BRAND_RULES = {
  // ─────────────────────────────────────────────────
  // VINCOLI INVIOLABILI (PRIORITÀ ASSOLUTA)
  // Bug HTML ricorrenti che NON devono MAI ripetersi.
  // Questi vincoli sovrascrivono qualunque altra istruzione successiva.
  // ─────────────────────────────────────────────────
  vincoli_inviolabili: [
    "FOTO PRODOTTO senza rettangoli o sfondi: la <td> che contiene <img> NON deve avere style background:#fff o background-color o border o padding > 8px. Solo <td align=\"center\" style=\"padding:0;line-height:0\"> con dentro <img>. Sbagliato: <td style=\"background:#ffffff;padding:24px\">. Giusto: <td align=\"center\" style=\"padding:0;line-height:0\"><img src=\"...\" style=\"display:block;width:100%;max-width:280px;height:auto;border:0;outline:none\"></td>",
    "DIMENSIONI IMMAGINI tutte uguali: ogni immagine prodotto deve avere ESATTAMENTE gli stessi attributi width=\"280\" height=\"280\" e stile style=\"display:block;width:100%;max-width:280px;height:280px;object-fit:cover\". Le foto non possono apparire più alte o più basse l'una dall'altra. Sbagliato: lasciare le immagini ad altezza naturale. Giusto: usare object-fit:cover su altezza fissa così tutte le foto hanno lo stesso ingombro visivo.",
    "TUTTO CENTRATO: ogni <td> testo deve avere align=\"center\" e style=\"text-align:center\". Hero, eyebrow, headline, prezzo, nome prodotto, CTA, payoff, footer: TUTTO va centrato orizzontalmente. Nessun text-align:left mai. Sbagliato: <td style=\"padding:20px\">. Giusto: <td align=\"center\" style=\"text-align:center;padding:20px\">.",
    "MOBILE 2-PRODOTTI-PER-RIGA: quando l'email mostra 2 o più prodotti affiancati, la griglia DEVE rimanere 2 colonne anche su mobile. NON usare media query che convertono le card a 100% width su schermo piccolo. Sbagliato: @media (max-width:600px) { .product-col { width: 100% !important; display: block; } }. Giusto: @media (max-width:600px) { .product-col { width: 50% !important; } } e fonts ridotti per stare comodi nello stretto. SEMPRE 2 card per riga, MAI 1 per riga su mobile."
  ],

  // ─────────────────────────────────────────────────
  // DATI PRODOTTO (prezzi, URL, nomi)
  // Regole su come trattare i dati passati in input
  // ─────────────────────────────────────────────────
  dati_prodotto: [
    "MAI inventare prezzi. Usa ESCLUSIVAMENTE il prezzo fornito nel catalog per ogni prodotto. Se il prezzo non è disponibile, scrivi '€—' (trattino em dash) invece di inventare un numero.",
    "MAI inventare URL prodotti. Usa ESCLUSIVAMENTE l'URL completo fornito nel catalog. NON generare handles fittizi (es. 'product-slug-copia', 'product-v2', 'model-new').",
    "MAI inventare nomi prodotti. Usa ESCLUSIVAMENTE i nomi esatti forniti nel catalog, senza aggiungere parole (es. se il catalog dice 'Slick', scrivi 'Slick' e non 'Slick Edition' o 'Nuovo Slick').",
    "Se un prodotto non ha URL immagine valida, omettilo dall'email invece di usare un placeholder."
  ],

  // ─────────────────────────────────────────────────
  // COPY & LINGUAGGIO
  // Regole su come scrivere testi, subject, CTA
  // ─────────────────────────────────────────────────
  copy_linguaggio: [
    "CTA prodotto: usa sempre una variante breve e assertiva in base al contesto (es: 'LO VOGLIO', 'PRENDILO', 'SCOPRILO', 'È MIO'). Varia tra card diverse della stessa email. Mai 'SCOPRI ORA' (troppo generico).",
    "CTA globale finale: può essere più lungo ma deve essere assertivo. Evita domande retoriche deboli ('PRONTO PER L'ESTATE?'). Preferisci affermazioni ('VEDI TUTTO', 'ENTRA NEL MONDO MATTO', 'COLLEZIONE COMPLETA').",
    "Mai scrivere 'sconto', 'offerta', 'promozione' a meno che non sia esplicitamente richiesto nelle note della campagna. OM è un brand che non si posiziona sul prezzo.",
    "Subject line: max 35 caratteri. Mai emoji nel subject. Mai punti esclamativi multipli.",
    "Tono: diretto, assertivo, urbano, provocatorio. Frasi corte. Mai aziendalese ('Gentile cliente', 'Siamo lieti di...'). Dare SEMPRE del tu, mai del lei."
  ],

  // ─────────────────────────────────────────────────
  // STRUTTURA & LAYOUT
  // Regole fisse sulla struttura dell'email
  // ─────────────────────────────────────────────────
  struttura_layout: [
    "La tagline 'CRAZY FASHION EYEWEAR SINCE 2019' va SOLO nel footer, mai nell'header o in altre sezioni.",
    "Logo header: SEMPRE 180px di larghezza, centrato, su bg #1a1a1a.",
    "Logo footer: SEMPRE 130px di larghezza, centrato.",
    "Quote block: chiudere con la firma breve '— OM' (em dash + OM), mai con '— OCCHIALE MATTO TEAM' o altre firme aziendali.",
    "Ogni email deve avere la strip feature 3-4 colonne emoji (🚚 spedizione · 🔄 reso · ☀️ UV400 · 📦 custodia) come elemento di rassicurazione.",
    "Footer obbligatorio: logo, payoff, 3 negozi Roma cliccabili su Google Maps (Baldo degli Ubaldi 212, Tuscolana 487A, CC Euroma 2), link social testuali, {% unsubscribe %}."
  ],

  // ─────────────────────────────────────────────────
  // SOCIAL & CONTATTI
  // Regole sul footer e collegamenti esterni
  // ─────────────────────────────────────────────────
  social_contatti: [
    "Social nel footer: NON usare quadratini colorati con iniziali 'IG'/'TK' o simili. Usare invece link testuali puliti tipo 'SEGUICI SU INSTAGRAM →' e 'SEGUICI SU TIKTOK →' in uppercase letterspacing 2-3px.",
    "Handle Instagram corretto: @occhiale_matto (URL: https://www.instagram.com/occhiale_matto).",
    "Handle TikTok corretto: @occhiale_matto_official (URL: https://www.tiktok.com/@occhiale_matto_official).",
    "I link dei negozi Roma devono sempre puntare a Google Maps con query 'Via [indirizzo completo] Roma'."
  ],

  // ─────────────────────────────────────────────────
  // TECNICO / HTML
  // Regole tecniche strict su markup e compatibilità
  // ─────────────────────────────────────────────────
  tecnico_html: [
    "Ogni CTA deve avere doppia protezione colore: il bottone <a> deve avere style color inline, E dentro deve esserci uno <span> con 'color:#XXX !important; text-decoration:none !important;' per forzare il colore anche in Gmail dark mode.",
    "Ogni img deve avere alt text descrittivo reale, non generico (es. 'Occhiale Matto Slick - occhiale da sole estate 2025' e non 'prodotto').",
    "Non usare display:inline-block su td per layout responsive. Per la strip feature usa table nidificate con width percentuali.",
    "Non mettere style duplicati o in conflitto nello stesso elemento (es. 'color:#1a1a1a' e poi 'color:#f0ebe3' nello stesso style: vince l'ultimo, ma è codice sporco).",
    "Evita CSS grid e flexbox nel body dell'email (supporto email client limitato). Usa solo table con role='presentation'."
  ]
};

/**
 * Formatta le regole come prompt text da iniettare in buildHtmlPrompt.
 */
export function formatBrandRulesForPrompt(): string {
  const sections = [
    { key: "vincoli_inviolabili", label: "VINCOLI INVIOLABILI — VIETATO RIPETERE QUESTI BUG" },
    { key: "dati_prodotto", label: "DATI PRODOTTO (PRIORITÀ MASSIMA)" },
    { key: "copy_linguaggio", label: "COPY E LINGUAGGIO" },
    { key: "struttura_layout", label: "STRUTTURA E LAYOUT" },
    { key: "social_contatti", label: "SOCIAL E CONTATTI" },
    { key: "tecnico_html", label: "TECNICO HTML" }
  ];

  let output = "\n================================================================\n";
  output += "CORREZIONI VINCOLANTI — REGOLE BRAND OCCHIALE MATTO\n";
  output += "Queste regole sono estratte dall'esperienza reale e sovrascrivono\n";
  output += "qualsiasi istruzione generica precedente. DEVONO essere rispettate.\n";
  output += "================================================================\n";

  for (const section of sections) {
    const rules = (BRAND_RULES as any)[section.key] as string[];
    if (!rules || rules.length === 0) continue;
    output += `\n### ${section.label}\n`;
    rules.forEach((rule, i) => {
      output += `${i + 1}. ${rule}\n`;
    });
  }

  return output;
}
