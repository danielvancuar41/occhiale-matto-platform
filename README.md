# Occhiale Matto — Email Intelligence Platform

Piattaforma Next.js per generare email Klaviyo data-driven, basata su analisi delle campagne passate e integrazione Claude + Shopify + Klaviyo.

## Cosa fa

1. **Dashboard analytics** — KPI live (OR, CR, revenue), alert automatico quando il CR scende, trend mensile, performance per tipologia email, top/bottom campagne.
2. **Generatore email** — scegli tipo + prodotti → Claude analizza i pattern vincenti dallo storico e propone 3 subject + preview + strategia → genera HTML pronto da incollare su Klaviyo.
3. **Storico campagne** — tutte le email inviate filtrabili per mese, con badge performance.

## Stack

- Next.js 15 App Router + React 19
- Claude Opus 4.7 via Anthropic SDK (server-side)
- Klaviyo API v2024-10-15 (campagne + metriche live)
- Shopify Storefront API 2024-10 (catalogo prodotti)
- Tailwind CSS
- Deploy: Vercel

## Setup locale

```bash
git clone <repo-url>
cd occhiale-matto-platform
npm install
cp .env.example .env.local
# compila .env.local con le chiavi (vedi sezione Env Vars)
npm run dev
```

Apri http://localhost:3000.

## Env vars

Tutte le chiavi stanno **solo lato server**. Il client non le vede mai.

| Variabile                     | Dove prenderla                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `ANTHROPIC_API_KEY`           | https://console.anthropic.com/ → API Keys                                      |
| `KLAVIYO_API_KEY`             | Klaviyo → Settings → API Keys → Create Private Key (scope: campaigns:read, metrics:read) |
| `KLAVIYO_CONVERSION_METRIC_ID`| Klaviyo → Metrics → "Placed Order" → copy ID                                   |
| `SHOPIFY_STORE_DOMAIN`        | es. `occhialematto.myshopify.com`                                              |
| `SHOPIFY_STOREFRONT_TOKEN`    | Shopify Admin → Apps → Develop apps → Create app → Storefront API access token |

La piattaforma funziona anche senza Klaviyo e Shopify configurati: in fallback usa il CSV export manuale e il catalogo hardcoded nel componente.

## Deploy su Vercel

1. Push del repo su GitHub.
2. Su https://vercel.com → New Project → Import repo.
3. Framework preset: Next.js (auto-detected).
4. Environment Variables: incolla tutte le chiavi dalla tabella sopra.
5. Deploy.

Vercel rileva `next build` automaticamente. Primo deploy ~90s.

## Struttura

```
app/
├── api/
│   ├── generate/route.ts    # POST → Claude (strategy | html)
│   ├── klaviyo/route.ts     # GET live → Klaviyo API | POST → parse CSV
│   └── shopify/route.ts     # GET → catalogo live
├── layout.tsx
├── page.tsx                  # mount del componente principale
└── globals.css
components/
└── OcchialeMattoPlatform.tsx # dashboard + generator + storico
lib/
├── anthropic.ts              # SDK + prompts stratificati
├── klaviyo.ts                # wrapper Klaviyo API
├── shopify.ts                # wrapper Shopify Storefront
└── csv.ts                    # parser CSV Klaviyo export
data/
└── klaviyo-seed.csv          # dataset iniziale
```

## Come funziona il generatore

Tre step:

**Step 1 — Configura**: scegli tipo email (multi-prodotto, nuovo arrivo, categoria, community), selezioni prodotti dal catalogo, aggiungi focus/note opzionali.

**Step 2 — Strategia**: chiamata a `/api/generate` in mode `strategy`. Il server costruisce un prompt stratificato che include:
- regole brand permanenti (tono, palette, pattern)
- ultime 8 campagne con performance (il sistema sa cosa non ripetere)
- top 10 performer per revenue (il sistema sa cosa funziona)
- prodotti selezionati

Claude restituisce JSON con 3 subject + preview + score + rationale + strategia email + giorno consigliato.

**Step 3 — HTML**: scegli una subject, il server chiama Claude in mode `html` con le 24 regole tecniche del brand (inline styles, dark-mode safe, CTA doppia protezione, footer negozi Roma, ecc.). L'output è un HTML completo pronto da incollare in Klaviyo.

## Roadmap

**v1 (questa) — MVP funzionante**
- [x] Dashboard con dati CSV/API
- [x] Generatore a 3 step (config → strategia → HTML)
- [x] API routes server-side con chiavi protette
- [x] Deploy Vercel-ready

**v2 — Live data**
- [ ] Sync automatico Klaviyo ogni notte (cron job Vercel)
- [ ] Pull prodotti Shopify live (sostituisce il catalogo hardcoded)
- [ ] Persistenza campagne in database (Supabase o Vercel KV)

**v3 — Intelligence loop**
- [ ] Webhook post-invio Klaviyo → auto-analisi performance
- [ ] A/B test suggestion sulle subject proposte
- [ ] Raccomandazione proattiva settimanale via email/Slack

## Scripts

```bash
npm run dev      # local dev
npm run build    # production build
npm run start    # start production server
npm run lint     # eslint
```

## Note

- L'API key di Anthropic è **solo server-side** (`ANTHROPIC_API_KEY`, non `NEXT_PUBLIC_*`). Non esporla mai al client.
- Il modello usato è `claude-opus-4-7` per la generazione strategica/HTML. Se vuoi risparmiare token, cambia in `lib/anthropic.ts` il valore di `MODELS.strategic` a `claude-haiku-4-5-20251001`.
- Rate limits: Klaviyo ha 150 req/min in burst, 700/min steady. Più che sufficiente per il volume attuale.

---

Beehind / Occhiale Matto — 2026
