# Occhiale Matto — Email Intelligence Platform

Piattaforma Next.js per generare email Klaviyo data-driven, basata su analisi delle campagne passate e integrazione Claude + catalogo occhialematto.com + Klaviyo. Include la sezione ADV (report settimanali Meta Ads su Supabase).

## Cosa fa

1. **Dashboard analytics** — KPI live (OR, CR, revenue), alert quando il CR scende, trend mensile, performance per tipologia email, ultime campagne.
2. **Generatore email** — scegli tipo + stile + prodotti → Claude analizza i pattern vincenti dallo storico e propone subject + preview + strategia → genera HTML pronto da incollare su Klaviyo. Le ultime 10 email generate restano nello storico del browser.
3. **Storico campagne** — tutte le email inviate filtrabili per mese.
4. **ADV** — report settimanali Meta Ads (acquisizione, retargeting, traffico), estrazione dati da screenshot/testo, confronti, trend e diagnosi AI.
5. **Cover** — prompt standard per generare cover prodotto con Nano Banana.

## Stack

- Next.js 16 App Router + React 19
- Claude Opus 5.5 (`claude-opus-5-5`) via Anthropic SDK, solo lato server
- Klaviyo API (campagne + Reports API)
- Catalogo: `products.json` pubblico di occhialematto.com
- Supabase (sezione ADV)
- Tailwind CSS
- Deploy: Vercel

## Env vars

Tutte le chiavi stanno **solo lato server**. Il client non le vede mai.

| Variabile | Obbligatoria | Note |
| --- | --- | --- |
| `APP_PASSWORD` | **sì** | Password di accesso alla piattaforma (HTTP Basic Auth). Senza, in produzione il sito resta bloccato (503). |
| `APP_USER` | no | Se impostata, al login serve anche questo nome utente. Altrimenti il nome utente è libero. |
| `ANTHROPIC_API_KEY` | sì | https://console.anthropic.com/ → API Keys |
| `ANTHROPIC_MODEL` | no | Per cambiare modello senza toccare il codice (default `claude-opus-5-5`). |
| `KLAVIYO_API_KEY` | sì | Klaviyo → Settings → API Keys → Private Key (scope: campaigns:read, metrics:read) |
| `KLAVIYO_CONVERSION_METRIC_ID` | sì | Klaviyo → Metrics → "Placed Order" → ID |
| `NEXT_PUBLIC_SUPABASE_URL` | sì (ADV) | Progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sì (ADV) | Progetto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | sì (ADV) | Solo server, mai esposta al client |
| `DEBUG_ENV_TOKEN` | no | Abilita `/api/debug-env?key=...` |

Copia `.env.example` in `.env.local` per lo sviluppo locale.

## Deploy su Vercel

1. **Prima del deploy**: Vercel → progetto → Settings → Environment Variables → aggiungi `APP_PASSWORD` (Production e Preview).
2. Push su GitHub (o deploy manuale).
3. Apri il sito: il browser chiede utente e password. Utente: qualsiasi (o `APP_USER` se l'hai impostato), password: `APP_PASSWORD`.

Il cron giornaliero `/api/keep-alive` (tiene sveglio Supabase) è escluso dalla password.

## Setup locale

```bash
npm install
cp .env.example .env.local
npm run dev
```

In locale (`npm run dev`) senza `APP_PASSWORD` si entra senza password.

## Struttura

```
proxy.ts                        # password su tutta l'app (Next 16: ex middleware)
app/
├── api/
│   ├── generate/route.ts       # POST → Claude (strategy | html)
│   ├── catalog/route.ts        # GET → catalogo live da occhialematto.com
│   ├── klaviyo/route.ts        # GET → campagne + statistiche Klaviyo
│   ├── adv/…                   # CRUD settimane ADV, estrazione, diagnosi
│   └── keep-alive/route.ts     # cron Vercel per Supabase
├── layout.tsx
├── page.tsx
└── globals.css
components/
└── OcchialeMattoPlatform.tsx   # dashboard + generatore + campagne + ADV + cover
lib/
├── anthropic.ts                # runClaude() + prompt strategia/HTML
├── brand-rules.ts              # regole brand iniettate nel prompt HTML
├── html-postprocess.ts         # placeholder → URL reali, controllo disiscrizione
├── scraper.ts                  # lettura products.json di occhialematto.com
├── klaviyo.ts                  # campagne, statistiche, tipologia
└── supabase.ts
```

## Come funziona il generatore

**Step 1 — Configura**: tipo email, stile grafico (Classico, Minimal, Bold, Editorial, Statement), tema colori, prodotti (con ricerca, filtro novità/fotocromatici), focus e note. Serve almeno un prodotto.

**Step 2 — Strategia**: `/api/generate` in mode `strategy`. Il prompt include regole brand, ultime 8 campagne (con tipologia), le 5 migliori per revenue ogni 1000 destinatari e i **dati ufficiali** dei prodotti (caratteristiche dai tag Shopify, colori disponibili, misure). Claude risponde in JSON garantito (structured output) con 3 subject (4 per Statement, ognuna con subject + frase statement), preview, punteggio, giorno consigliato e attenzioni.

**Step 3 — HTML**: scegli una proposta; il server chiama Claude con regole brand + template + palette. Gli URL di immagini e prodotti sono placeholder sostituiti lato server con quelli esatti del catalogo. Il server corregge il link di disiscrizione in `{% unsubscribe_link %}`, blocca HTML troncati e segnala cosa controllare prima di incollare su Klaviyo.

## Novità di questa versione

**Sicurezza**
- Password su tutta la piattaforma (`APP_PASSWORD`): prima chiunque con il link poteva leggere, modificare e cancellare i dati ADV e usare il generatore a spese della chiave Anthropic.
- Le richieste di modifica partite da altri siti vengono bloccate (il browser allega la password salvata anche a quelle).

**Email generate**
- Link di disiscrizione corretto: `{% unsubscribe %}` dentro un `href` rompe il link, ora si usa `{% unsubscribe_link %}` (con correzione automatica di tutte le varianti e avviso se manca o non è valido).
- Claude riceve i dati reali dei prodotti (caratteristiche, colori, misure) e ha il divieto di inventare materiali, provenienza o tipo di lenti.
- HTML troncato → errore chiaro invece di email senza footer.
- Avviso se un link o un'immagine dell'email non ha un indirizzo valido.
- Template Statement: la scelta arriva davvero alla strategia; subject e frase statement sono separate; usa un solo prodotto.
- Anno e stagione nei prompt calcolati automaticamente.

**Catalogo**
- Esclusi gift card, catenine, kit cacciaviti, servizi lenti.
- Genere corretto (i modelli con tag Donna + Uomo sono unisex, non "donna").
- Fotocromatici letti dal tag Shopify invece che da una lista scritta a mano ormai sbagliata.
- A Claude arrivano solo le misure (asta, montatura, ponte, lente), non il testo promozionale della scheda.
- Rimossa la lista prodotti di riserva: aveva URL immagine inesistenti. Se il catalogo non risponde, compare un errore con "Riprova".

**Generatore**
- Non si può generare senza prodotti (prima ne sceglieva 6 a caso).
- Cambiare tab non cancella più l'email generata; storico delle ultime 10 email nel browser.
- Errori mostrati come errori (prima diventavano "HTML" copiabile), avvisi da controllare, contatore dei secondi, copia rapida di subject e preview.

**Dati e analisi**
- Tipologia campagne più accurata (le campagne classificate "brand" per mancanza di regole passano da 36 su 75 a 10).
- Campagne migliori per revenue ogni 1000 destinatari (le liste hanno dimensioni diverse).
- Se Klaviyo va in rate limit, le statistiche buone non vengono più sovrascritte con zeri; avviso visibile.
- Escluse bozze e campagne programmate.
- ADV: CPA a zero non più premiato come "migliore" nei confronti; date locali corrette; una diagnosi troncata non sovrascrive quella salvata.

**Tecnico**
- Modello Claude Opus 5.5 con streaming, output JSON garantito, cache del prompt HTML, fallback automatico se un filtro di sicurezza blocca per errore.
- L'HTML si genera con effort basso per restare sotto il limite di 5 minuti di Vercel. Nei log di Vercel ogni chiamata a Claude riporta durata e token.
- Controllo dei tipi di nuovo attivo nel build (prima `ignoreBuildErrors`).
- Font DM Sans e Space Mono caricati, layout che va in colonna su schermi stretti.

## Scripts

```bash
npm run dev      # sviluppo locale
npm run build    # build di produzione
npm run start    # server di produzione
```

---

Beehind / Occhiale Matto — 2026
