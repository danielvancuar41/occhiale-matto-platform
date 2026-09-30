import { NextResponse, type NextRequest } from "next/server";

/**
 * Protezione con password (HTTP Basic Auth) su tutta la piattaforma: pagina e API.
 * Senza, chiunque abbia il link può leggere/cancellare i dati ADV e usare il
 * generatore consumando crediti Anthropic.
 *
 * Env su Vercel:
 *   APP_PASSWORD  (obbligatoria) password di accesso
 *   APP_USER      (opzionale)    se impostata, anche il nome utente deve coincidere
 *
 * Se APP_PASSWORD manca, in produzione il sito resta chiuso (503) invece di aprirsi a
 * tutti; in locale (npm run dev) si entra senza password.
 */
export function proxy(req: NextRequest) {
  // Il browser allega da solo la password salvata anche a richieste partite da altri siti:
  // le scritture (POST/PUT/DELETE…) sono accettate solo dalla piattaforma stessa.
  if (isCrossSiteWrite(req)) {
    return new NextResponse("Richiesta bloccata: proviene da un altro sito.", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  const password = process.env.APP_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse(
      "Piattaforma bloccata: configura la variabile APP_PASSWORD su Vercel e rifai il deploy.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    const decoded = decodeBase64(header.slice(6).trim());
    const sep = decoded.indexOf(":");
    if (sep !== -1) {
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      const expectedUser = process.env.APP_USER;
      if (safeEqual(pass, password) && (!expectedUser || safeEqual(user, expectedUser))) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Accesso riservato", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Occhiale Matto", charset="UTF-8"' }
  });
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function isCrossSiteWrite(req: NextRequest): boolean {
  if (SAFE_METHODS.has(req.method)) return false;
  const site = req.headers.get("sec-fetch-site");
  if (site) return site !== "same-origin" && site !== "none";
  // Browser vecchi senza Sec-Fetch-Site: si confronta l'Origin con l'host richiesto
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = new URL(origin).host;
    return host !== req.headers.get("host") && host !== req.headers.get("x-forwarded-host");
  } catch {
    return true; // Origin "null" o non valido
  }
}

function decodeBase64(value: string): string {
  try {
    return typeof Buffer !== "undefined"
      ? Buffer.from(value, "base64").toString("utf8")
      : new TextDecoder().decode(Uint8Array.from(atob(value), c => c.charCodeAt(0)));
  } catch {
    return "";
  }
}

/** Confronto a tempo costante (non rivela quanti caratteri sono giusti). */
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export const config = {
  // Esclusi: asset statici e /api/keep-alive (lo chiama il cron di Vercel senza password).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/keep-alive).*)"]
};
