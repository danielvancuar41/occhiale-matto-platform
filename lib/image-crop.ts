import { inflateSync } from "node:zlib";

/**
 * Template Statement: le foto prodotto su sfondo bianco sono quadrate con l'occhiale al
 * centro, e il bianco sopra e sotto (circa un terzo ciascuno) allontana le frasi
 * dall'occhiale. Qui si misura dove sta l'occhiale e si chiede al CDN di Shopify una
 * versione ritagliata sulla sua fascia (crop=region), senza toccare le foto del negozio.
 * Foto non su bianco, CDN diverso, dimensioni ignote o errori: resta la foto originale.
 */

export type HeroPhoto = { url: string; cropped: boolean };

const PROBE_WIDTH = 200;
const MAX_OUTPUT_WIDTH = 1040; // 2x dei 520px dell'email
// Un pixel è "occhiale" se non è quasi bianco o se ha una tinta: le lenti chiare
// (azzurre, rosate) sono molto vicine al bianco e non vanno tagliate.
const WHITE = 238;
const TINT = 12;

type Raster = { width: number; height: number; channels: number; data: Uint8Array };

/** Decodifica i PNG 8 bit non interlacciati (grigio, RGB, con o senza alpha) che produce il CDN. */
export function decodePng(buf: Uint8Array): Raster | null {
  const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
  if (buf.length < 8 || SIGNATURE.some((b, i) => buf[i] !== b)) return null;

  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let width = 0, height = 0, bitDepth = 0, colorType = -1, interlace = 0;
  const idat: Uint8Array[] = [];
  for (let pos = 8; pos + 8 <= buf.length;) {
    const len = view.getUint32(pos);
    const type = String.fromCharCode(buf[pos + 4], buf[pos + 5], buf[pos + 6], buf[pos + 7]);
    if (type === "IHDR") {
      width = view.getUint32(pos + 8);
      height = view.getUint32(pos + 12);
      bitDepth = buf[pos + 16];
      colorType = buf[pos + 17];
      interlace = buf[pos + 20];
    } else if (type === "IDAT") {
      idat.push(buf.subarray(pos + 8, pos + 8 + len));
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + len;
  }

  const channels = ({ 0: 1, 2: 3, 4: 2, 6: 4 } as Record<number, number>)[colorType];
  if (!width || !height || bitDepth !== 8 || !channels || interlace !== 0) return null;

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  if (raw.length < height * (stride + 1)) return null;

  const data = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = data.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? data.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? row[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = src[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      row[x] = v & 255;
    }
  }
  return { width, height, channels, data };
}

/** La riga y contiene pezzi di occhiale (non solo sfondo bianco o trasparente)? */
function rowHasInk(img: Raster, y: number): boolean {
  const { width, channels, data } = img;
  const minPixels = Math.max(2, Math.round(width * 0.005)); // ignora puntini e rumore JPEG
  const alpha = channels === 4 ? 3 : channels === 2 ? 1 : -1;
  let n = 0;
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    if (alpha !== -1 && data[i + alpha] < 20) continue; // trasparente = sfondo
    const lo = channels >= 3 ? Math.min(data[i], data[i + 1], data[i + 2]) : data[i];
    const hi = channels >= 3 ? Math.max(data[i], data[i + 1], data[i + 2]) : data[i];
    if ((lo < WHITE || hi - lo > TINT) && ++n >= minPixels) return true;
  }
  return false;
}

/** Prima e ultima riga occupate dall'occhiale; null se la foto non ha sfondo bianco sopra e sotto. */
export function inkRows(img: Raster): { top: number; bottom: number } | null {
  const { height } = img;
  const hasInk = (y: number) => rowHasInk(img, y);

  let top = 0;
  while (top < height && !hasInk(top)) top++;
  if (top === height) return null;
  let bottom = height - 1;
  while (bottom > top && !hasInk(bottom)) bottom--;

  // Foto lifestyle o su sfondo colorato: arrivano ai bordi, non c'è bianco da togliere
  if (top < height * 0.05 || bottom > height * 0.95) return null;
  return { top, bottom };
}

/**
 * Fascia da tenere (in righe della foto analizzata): l'occhiale più un margine uguale
 * sopra e sotto. null se il bianco da togliere è poco.
 */
export function cropRows(band: { top: number; bottom: number }, height: number): { top: number; height: number } | null {
  const glasses = band.bottom - band.top + 1;
  const margin = Math.max(0.25 * glasses, 0.04 * height);
  let top = band.top - margin;
  let rows = glasses + 2 * margin;
  // Mai una striscia troppo sottile: al massimo circa 3:1 su una foto quadrata
  const minRows = 0.32 * height;
  if (rows < minRows) {
    top -= (minRows - rows) / 2;
    rows = minRows;
  }
  top = Math.min(Math.max(0, top), height - rows);
  if (rows > 0.85 * height) return null;
  return { top: Math.max(0, Math.round(top)), height: Math.min(height, Math.round(rows)) };
}

/** Il ritaglio tiene l'occhiale intero: le prime e le ultime righe devono essere solo sfondo. */
export function edgesAreClear(img: Raster): boolean {
  const edge = Math.max(2, Math.round(img.height * 0.02));
  for (let i = 0; i < edge; i++) {
    if (rowHasInk(img, i) || rowHasInk(img, img.height - 1 - i)) return false;
  }
  return true;
}

async function fetchPng(url: URL): Promise<Raster | null> {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
  return res.ok ? decodePng(new Uint8Array(await res.arrayBuffer())) : null;
}

/** URL della foto eroe per il template Statement: ritagliata se conviene, altrimenti l'originale. */
export async function heroPhoto(src: string, originalWidth?: number, originalHeight?: number): Promise<HeroPhoto> {
  const original: HeroPhoto = { url: src, cropped: false };
  // Il ritaglio si esprime in pixel della foto originale: senza le sue dimensioni non si tocca
  if (!originalWidth || !originalHeight || originalWidth < 400) return original;

  let base: URL;
  try {
    base = new URL(src);
  } catch {
    return original;
  }
  if (base.hostname !== "cdn.shopify.com" && !base.pathname.includes("/cdn/shop/")) return original;

  try {
    const probe = new URL(base);
    probe.searchParams.set("width", String(PROBE_WIDTH));
    probe.searchParams.set("format", "png");
    const img = await fetchPng(probe);
    // A volte il CDN ridimensiona una versione diversa dall'originale (es. quadrata invece
    // che verticale): se le proporzioni non tornano, le misure non valgono
    if (!img || Math.abs(img.height / img.width - originalHeight / originalWidth) > 0.03) return original;

    const band = inkRows(img);
    const rows = band ? cropRows(band, img.height) : null;
    if (!rows) return original;

    // Dalle righe della foto analizzata ai pixel dell'originale
    const scale = originalHeight / img.height;
    const cropTop = Math.round(rows.top * scale);
    const cropHeight = Math.min(originalHeight - cropTop, Math.round(rows.height * scale));
    const out = new URL(base);
    out.searchParams.set("crop", "region");
    out.searchParams.set("crop_left", "0");
    out.searchParams.set("crop_top", String(cropTop));
    out.searchParams.set("crop_width", String(originalWidth));
    out.searchParams.set("crop_height", String(cropHeight));
    out.searchParams.set("width", String(Math.min(MAX_OUTPUT_WIDTH, originalWidth)));

    // Controllo finale sul risultato vero del CDN: se l'occhiale tocca il bordo, foto intera
    const check = new URL(out);
    check.searchParams.set("width", String(PROBE_WIDTH));
    check.searchParams.set("format", "png");
    const result = await fetchPng(check);
    if (!result || !edgesAreClear(result)) return original;

    return { url: out.toString(), cropped: true };
  } catch (err) {
    console.warn("[image-crop] foto lasciata intera:", err);
    return original;
  }
}
