import type { Product } from "./anthropic";

/**
 * Sostituisce i placeholder con gli URL esatti del catalogo e corregge/controlla
 * gli errori noti che Klaviyo non perdona.
 */
export function postProcessHtml(input: string, products: Product[], logoUrl: string) {
  const warnings: string[] = [];
  let html = input;

  // ── PLACEHOLDER → URL ESATTI ──
  // Claude usa {{IMG_n}} / {{URL_n}} / {{LOGO}} invece di ricopiare gli URL (evita typo
  // negli URL immagine). Qui li rimpiazziamo con i valori esatti dal catalog.
  let unknownIndex = false;
  html = html.replace(/\{\{\s*(IMG|URL)_(\d+)\s*\}\}/g, (_m, kind: string, idx: string) => {
    const p = products[Number(idx)];
    if (!p) unknownIndex = true;
    const target = p || products[0];
    return kind === "IMG" ? target.img : target.url;
  });
  if (unknownIndex) {
    warnings.push("Claude ha usato un prodotto in più di quelli scelti: l'ho sostituito con il primo prodotto. Controlla l'anteprima.");
  }
  html = html.replace(/\{\{\s*LOGO\s*\}\}/g, logoUrl);

  // ── DISISCRIZIONE KLAVIYO ──
  // {% unsubscribe %} genera un link completo: dentro un href rompe il link.
  // Dentro un href serve {% unsubscribe_link %}, che produce solo l'URL.
  // Copre anche href senza virgolette e la variante con testo: {% unsubscribe 'Disiscriviti' %}
  const BAD_UNSUB = String.raw`\{%\s*unsubscribe(?:_url)?\b[^%]*%\}`;
  let fixedUnsub = false;
  html = html.replace(
    new RegExp(String.raw`href\s*=\s*(?:"\s*${BAD_UNSUB}\s*"|'\s*${BAD_UNSUB}\s*'|${BAD_UNSUB})`, "gi"),
    () => { fixedUnsub = true; return 'href="{% unsubscribe_link %}"'; }
  );
  if (fixedUnsub) {
    console.info("[generate] href di disiscrizione corretto in {% unsubscribe_link %}");
  }
  if (/href\s*=\s*["']?[^"'>]*\{%\s*unsubscribe(?!_link\b)/i.test(html)) {
    warnings.push("ATTENZIONE: il link di disiscrizione non è valido. Dentro href deve esserci solo {% unsubscribe_link %}: correggilo prima di inviare o rigenera.");
  } else if (!/\{%\s*unsubscribe(?:_link)?\b[^%]*%\}/i.test(html)) {
    warnings.push("ATTENZIONE: manca il link di disiscrizione ({% unsubscribe_link %}). Aggiungilo prima di inviare o rigenera.");
  }

  // Solo placeholder in stile {{URL_0}}: le variabili Klaviyo ({{ first_name }}…) sono volute
  const leftovers = html.match(/\{\{\s*[A-Z][A-Za-z0-9_]*\s*\}\}/g);
  if (leftovers) {
    warnings.push(`Placeholder non sostituiti nell'HTML: ${Array.from(new Set(leftovers)).join(", ")}`);
  }

  // Link o immagini senza un indirizzo vero (es. "URL_PRODOTTO" copiato dalle istruzioni)
  const badRefs = Array.from(html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']*)["']/gi))
    .map(m => m[1].trim())
    .filter(v => !/^(https?:\/\/|mailto:|tel:|#|\{%|\{\{)/i.test(v));
  if (badRefs.length) {
    const list = Array.from(new Set(badRefs)).slice(0, 5).map(v => v || "(vuoto)").join(", ");
    warnings.push(`Link o immagini senza un indirizzo valido: ${list}. Controlla l'anteprima.`);
  }

  return { html, warnings };
}
