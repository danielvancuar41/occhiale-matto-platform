"use client";
// @ts-nocheck — legacy v2 component, incremental typing to follow

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// OCCHIALE MATTO — EMAIL MARKETING INTELLIGENCE PLATFORM v2
// Full HTML Generator + Product Catalog + Analytics
// All AI calls go through /api/generate (server-side, keys protected)
// ═══════════════════════════════════════════════════════════════════

// ── PRODUCT CATALOG (from Shopify — manually synced for now) ──
const PRODUCTS = [
  { id:"destino", name:"Destino", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/destino", img:"https://occhialematto.com/cdn/shop/files/destino_hero.jpg" },
  { id:"destino-xl", name:"Destino XL", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/destino-xl", img:"https://occhialematto.com/cdn/shop/files/destino_xl_hero.jpg" },
  { id:"banlieue", name:"Banlieue", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/banlieue", img:"https://occhialematto.com/cdn/shop/files/banlieue_hero.jpg" },
  { id:"favela", name:"Favela", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/favela", img:"https://occhialematto.com/cdn/shop/files/favela_hero.jpg" },
  { id:"pigalle", name:"Pigalle", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/pigalle", img:"https://occhialematto.com/cdn/shop/files/pigalle_hero.jpg" },
  { id:"de-niro", name:"De Niro", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/de-niro", img:"https://occhialematto.com/cdn/shop/files/de_niro_hero.jpg" },
  { id:"ghepard-goccia", name:"Ghepard Goccia", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/ghepard-goccia", img:"https://occhialematto.com/cdn/shop/files/ghepard_goccia_hero.jpg" },
  { id:"ghepard-rett", name:"Ghepard Rettangolare", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/ghepard-rettangolare", img:"https://occhialematto.com/cdn/shop/files/ghepard_rett_hero.jpg" },
  { id:"quebec", name:"Quebec", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/quebec", img:"https://occhialematto.com/cdn/shop/files/quebec_hero.jpg" },
  { id:"prime", name:"Prime", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/prime", img:"https://occhialematto.com/cdn/shop/files/prime_hero.jpg" },
  { id:"mini-santos", name:"Mini Santos", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/mini-santos", img:"https://occhialematto.com/cdn/shop/files/mini_santos_hero.jpg" },
  { id:"elite", name:"Elitè", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/elite", img:"https://occhialematto.com/cdn/shop/files/elite_hero.jpg" },
  { id:"c-smoke", name:"C Smoke", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/c-smoke", img:"https://occhialematto.com/cdn/shop/files/c_smoke_hero.jpg" },
  { id:"figueretas", name:"Figueretas", price:29.99, category:"uomo", icon:true, url:"https://occhialematto.com/products/figueretas", img:"https://occhialematto.com/cdn/shop/files/figueretas_hero.jpg" },
  { id:"oni-one", name:"ONI ONE", price:59.99, category:"premium", url:"https://occhialematto.com/products/oni-one", img:"https://occhialematto.com/cdn/shop/files/oni_one_hero.jpg" },
  { id:"blood-money", name:"Blood Money Empire", price:59.99, category:"premium", url:"https://occhialematto.com/products/blood-money-empire", img:"https://occhialematto.com/cdn/shop/files/blood_money_hero.jpg" },
  { id:"elite-xl", name:"Élite XL", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/elite-xl", img:"https://occhialematto.com/cdn/shop/files/elite_xl_hero.jpg", new:true },
  { id:"hype-vintage", name:"Hype Vintage", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/hype-vintage", img:"https://occhialematto.com/cdn/shop/files/hype_vintage_hero.jpg", new:true, foto:true },
  { id:"hype-exagon", name:"Hype Exagon", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/hype-exagon", img:"https://occhialematto.com/cdn/shop/files/hype_exagon_hero.jpg", new:true },
  { id:"hype-bogota", name:"Hype Bogotà", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/hype-bogota", img:"https://occhialematto.com/cdn/shop/files/hype_bogota_hero.jpg", new:true },
  { id:"murphy", name:"Murphy", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/murphy", img:"https://occhialematto.com/cdn/shop/files/murphy_hero.jpg", new:true },
  { id:"sidney", name:"Sidney", price:49.99, category:"novita2026", url:"https://occhialematto.com/products/sidney", img:"https://occhialematto.com/cdn/shop/files/sidney_hero.jpg", new:true },
  { id:"cubic", name:"Cubic", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/cubic", img:"https://occhialematto.com/cdn/shop/files/cubic_hero.jpg", new:true },
  { id:"pacha", name:"Pacha", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/pacha", img:"https://occhialematto.com/cdn/shop/files/pacha_hero.jpg", new:true },
  { id:"rivoli", name:"Rivoli", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/rivoli", img:"https://occhialematto.com/cdn/shop/files/rivoli_hero.jpg", new:true },
  { id:"cardie", name:"Cardie", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/cardie", img:"https://occhialematto.com/cdn/shop/files/cardie_hero.jpg", new:true },
  { id:"novis", name:"Novis", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/novis", img:"https://occhialematto.com/cdn/shop/files/novis_hero.jpg", new:true },
  { id:"naos", name:"Naos", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/naos", img:"https://occhialematto.com/cdn/shop/files/naos_hero.jpg", new:true },
  { id:"urban-life", name:"Urban Life", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/urban-life", img:"https://occhialematto.com/cdn/shop/files/urban_life_hero.jpg", new:true },
  { id:"black-kaws", name:"Black Kaws", price:29.99, category:"novita2026", url:"https://occhialematto.com/products/black-kaws", img:"https://occhialematto.com/cdn/shop/files/black_kaws_hero.jpg", new:true },
  { id:"bamby-acetato", name:"Bamby Acetato", price:34.99, category:"novita2026", url:"https://occhialematto.com/products/bamby-acetato", img:"https://occhialematto.com/cdn/shop/files/bamby_acetato_hero.jpg", new:true },
];

const FOTO_MODELS = ["prime","ghepard-goccia","ghepard-rett","elite","c-smoke","quebec","pigalle","banlieue","hype-vintage"];

// ── CAMPAIGN DATA ──
const CAMPAIGNS = [
  { date:"2025-12-17", subject:"Non è un miracolo di Natale. È il 3x2!", or:51.6, cr:2.02, rev:152.94, orders:3, unsub:13, type:"promo" },
  { date:"2025-12-19", subject:"PRIME è arrivato. Il 3×2 pure. Uno paga zero!", or:51.1, cr:1.49, rev:152.94, orders:4, unsub:2, type:"drop" },
  { date:"2025-12-24", subject:"Buone Feste da Occhiale Matto!", or:53.3, cr:0.83, rev:140.94, orders:4, unsub:14, type:"brand" },
  { date:"2025-12-28", subject:"Con che occhiale entri nel nuovo anno?", or:57.7, cr:1.87, rev:130.95, orders:4, unsub:9, type:"brand" },
  { date:"2025-12-31", subject:"Un enorme grazie per questo 2025!", or:43.7, cr:1.01, rev:57.98, orders:1, unsub:11, type:"brand" },
  { date:"2026-01-07", subject:"Buoni propositi? Inizia dagli occhiali.", or:71.8, cr:1.86, rev:238.88, orders:6, unsub:20, type:"multi" },
  { date:"2026-01-10", subject:"È ora di vedere meglio.", or:70.9, cr:0.43, rev:299.84, orders:8, unsub:16, type:"categoria" },
  { date:"2026-01-14", subject:"C Smoke. Lenti sfumate, stile pulito, ego felice.", or:72.7, cr:1.30, rev:157.89, orders:5, unsub:22, type:"drop" },
  { date:"2026-01-16", subject:"Blood Money Empire.", or:71.6, cr:1.66, rev:233.86, orders:7, unsub:27, type:"drop" },
  { date:"2026-01-21", subject:"Invisibili. Ma non troppo.", or:72.0, cr:1.35, rev:85.96, orders:2, unsub:12, type:"drop" },
  { date:"2026-01-24", subject:"I vostri preferiti!", or:78.3, cr:2.12, rev:112.97, orders:4, unsub:19, type:"community" },
  { date:"2026-01-28", subject:"Banlieue 2.0 è arrivato!", or:73.2, cr:1.79, rev:152.96, orders:4, unsub:25, type:"drop" },
  { date:"2026-01-31", subject:"Modello Favela.", or:72.8, cr:0.65, rev:260.90, orders:5, unsub:15, type:"drop" },
  { date:"2026-02-04", subject:"DUMP by Occhiale Matto!", or:72.6, cr:1.07, rev:108.97, orders:2, unsub:8, type:"drop" },
  { date:"2026-02-06", subject:"BLACK KAWS è arrivato!", or:72.0, cr:1.38, rev:109.98, orders:3, unsub:10, type:"drop" },
  { date:"2026-02-11", subject:"De Niro è arrivato!", or:73.0, cr:1.37, rev:346.87, orders:7, unsub:10, type:"drop" },
  { date:"2026-02-14", subject:"I nuovi arrivi!", or:72.2, cr:1.59, rev:448.82, orders:11, unsub:8, type:"multi" },
  { date:"2026-02-18", subject:"Destino vs Banlieue.", or:72.0, cr:1.53, rev:337.90, orders:8, unsub:11, type:"multi" },
  { date:"2026-02-23", subject:"Il nuovo Bamby è arrivato!", or:72.3, cr:0.91, rev:172.94, orders:3, unsub:12, type:"drop" },
  { date:"2026-02-25", subject:"Fotocromatici matti!", or:60.1, cr:1.32, rev:364.84, orders:11, unsub:7, type:"categoria", html:true },
  { date:"2026-03-04", subject:"Nuova Ottica!", or:68.0, cr:0.13, rev:435.84, orders:9, unsub:9, type:"categoria", html:true },
  { date:"2026-03-05", subject:"Sono arrivati!", or:69.5, cr:2.89, rev:796.70, orders:16, unsub:11, type:"multi", html:true },
  { date:"2026-03-10", subject:"Lo sapevi?", or:67.5, cr:0.96, rev:216.90, orders:6, unsub:6, type:"categoria", html:true },
  { date:"2026-03-12", subject:"Il sole non aspetta.", or:67.4, cr:1.61, rev:374.89, orders:7, unsub:9, type:"multi", html:true },
  { date:"2026-03-17", subject:"Scegli il tuo lato!", or:67.5, cr:1.01, rev:152.96, orders:3, unsub:15, type:"multi", html:true },
  { date:"2026-03-20", subject:"Rivoli è arrivato!", or:68.1, cr:1.65, rev:272.88, orders:7, unsub:7, type:"drop", html:true },
  { date:"2026-03-24", subject:"Indovina quanti sono.", or:68.2, cr:1.21, rev:148.94, orders:5, unsub:15, type:"multi", html:true },
  { date:"2026-03-28", subject:"Nuovi. Già iconici.", or:69.6, cr:1.85, rev:259.92, orders:4, unsub:8, type:"multi", html:true },
  { date:"2026-03-31", subject:"Pacha è arrivato!", or:68.9, cr:1.59, rev:271.88, orders:7, unsub:14, type:"drop", html:true },
  { date:"2026-04-02", subject:"Stile anche a Pasqua.", or:68.0, cr:1.01, rev:165.94, orders:3, unsub:8, type:"stagionale", html:true },
  { date:"2026-04-08", subject:"Primavera Matta!", or:67.5, cr:1.13, rev:286.90, orders:5, unsub:7, type:"stagionale", html:true },
  { date:"2026-04-11", subject:"Lo dicono loro...", or:66.8, cr:0.66, rev:142.94, orders:3, unsub:6, type:"community", html:true },
  { date:"2026-04-14", subject:"Cardie è arrivato!", or:67.1, cr:1.04, rev:188.94, orders:5, unsub:9, type:"drop", html:true },
  { date:"2026-04-16", subject:"Uno, sempre giusto!", or:63.3, cr:0.65, rev:98.94, orders:3, unsub:9, type:"drop", html:true },
];

const TYPE_LABELS = { drop:"Nuovo Arrivo", multi:"Multi-Prodotto", categoria:"Categoria", community:"Community", promo:"Promo", brand:"Brand", stagionale:"Stagionale" };
const TYPE_COLORS = { drop:"#b8924a", multi:"#1a9d94", categoria:"#d64545", community:"#7c5cd4", promo:"#d97706", brand:"#52525b", stagionale:"#10b981" };

const fmtPct = n => n?.toFixed?.(1) ?? "0.0";

// ── ICONS ──
const I = {
  dash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  spark: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.15 2.15m8.5 8.5l2.15 2.15M5.6 18.4l2.15-2.15m8.5-8.5l2.15-2.15"/></svg>,
  list: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  up: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m18 15-6-6-6 6"/></svg>,
  down: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>,
  alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>,
  code: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
};

// ── SPARKLINE ──
function Spark({ data, color="#b8924a", w=100, h=28 }) {
  if (!data?.length) return null;
  const mn = Math.min(...data)*0.95, mx = Math.max(...data)*1.05, rng = mx-mn||1;
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-((v-mn)/rng)*h}`).join(" ");
  const last = data[data.length-1];
  return (
    <svg width={w} height={h} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      <circle cx={w} cy={h-((last-mn)/rng)*h} r="2.5" fill={color}/>
    </svg>
  );
}

// ── KPI CARD ──
function Kpi({ label, value, trend, spark, color="#b8924a", sub }) {
  const up = trend > 0;
  return (
    <div style={{ background:"#ffffff", border:"1px solid #e8ddd0", borderRadius:"10px", padding:"16px 18px", flex:1, minWidth:"160px", position:"relative" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:color, borderRadius:"10px 10px 0 0" }}/>
      <div style={{ fontSize:"10px", color:"#9a9089", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"6px" }}>{label}</div>
      <div style={{ fontSize:"24px", fontWeight:800, color:"#1a1a1a", fontFamily:"'Space Mono',monospace" }}>{value}</div>
      {sub && <div style={{ fontSize:"10px", color:"#7a7a7a", marginTop:"2px" }}>{sub}</div>}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"8px" }}>
        {trend !== undefined && (
          <span style={{ color:up?"#1a9d94":"#d64545", fontSize:"11px", fontWeight:600, display:"flex", alignItems:"center", gap:"2px" }}>
            {up ? I.up : I.down} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {spark}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [config, setConfig] = useState({ type:"multi", focus:"", notes:"", products:[] });
  const [htmlOutput, setHtmlOutput] = useState("");
  const [htmlStep, setHtmlStep] = useState(0); // 0=not started, 1=generating, 2=done
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [viewMode, setViewMode] = useState("preview"); // preview | mobile | code
  const [copied, setCopied] = useState(false);
  const [filterMonth, setFilterMonth] = useState("all");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [liveProducts, setLiveProducts] = useState(null); // null = not loaded yet, array = loaded
  const [catalogLoading, setCatalogLoading] = useState(false);
  const htmlRef = useRef(null);

  // ── Fetch live catalog from occhialematto.com on mount ──
  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    fetch("/api/catalog")
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.ok && Array.isArray(data.products)) {
          setLiveProducts(data.products);
        }
      })
      .catch(err => console.error("[catalog] fetch failed", err))
      .finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Use live products if available, fallback to hardcoded
  const ACTIVE_PRODUCTS = liveProducts && liveProducts.length > 0 ? liveProducts : PRODUCTS;

  // ── Computed ──
  const last5 = CAMPAIGNS.slice(-5);
  const prev5 = CAMPAIGNS.slice(-10,-5);
  const avg = (arr, k) => arr.reduce((s,c)=>s+c[k],0)/arr.length;
  const avgOr5 = avg(last5,"or"), avgCr5 = avg(last5,"cr"), avgRev5 = avg(last5,"rev");
  const pOr5 = avg(prev5,"or"), pCr5 = avg(prev5,"cr"), pRev5 = avg(prev5,"rev");
  const tOr = ((avgOr5-pOr5)/pOr5)*100, tCr = ((avgCr5-pCr5)/pCr5)*100, tRev = ((avgRev5-pRev5)/pRev5)*100;
  const totalRev = CAMPAIGNS.reduce((s,c)=>s+c.rev,0);
  const totalOrd = CAMPAIGNS.reduce((s,c)=>s+c.orders,0);

  const months = useMemo(() => {
    const m = {};
    CAMPAIGNS.forEach(c => {
      const k = c.date.slice(0,7);
      if (!m[k]) m[k] = {cps:[], rev:0, ord:0, orS:0, crS:0};
      m[k].cps.push(c); m[k].rev+=c.rev; m[k].ord+=c.orders; m[k].orS+=c.or; m[k].crS+=c.cr;
    });
    return Object.entries(m).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>({
      key:k, label: ["","Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"][parseInt(k.slice(5,7))]+" "+k.slice(2,4),
      n:v.cps.length, rev:v.rev, ord:v.ord, avgOr:v.orS/v.cps.length, avgCr:v.crS/v.cps.length
    }));
  }, []);

  const typePerf = useMemo(() => {
    const tp = {};
    CAMPAIGNS.forEach(c => {
      if(!tp[c.type]) tp[c.type]={n:0,rev:0,ord:0,crS:0};
      tp[c.type].n++; tp[c.type].rev+=c.rev; tp[c.type].ord+=c.orders; tp[c.type].crS+=c.cr;
    });
    return Object.entries(tp).map(([k,v])=>({type:k,...v,avgRev:v.rev/v.n,avgCr:v.crS/v.n})).sort((a,b)=>b.avgRev-a.avgRev);
  }, []);

  const suggestedType = useMemo(() => {
    const recent = CAMPAIGNS.slice(-3).map(c=>c.type);
    if(!recent.includes("multi")) return "multi";
    if(!recent.includes("categoria")) return "categoria";
    return "multi";
  }, []);

  const filtered = filterMonth==="all" ? CAMPAIGNS : CAMPAIGNS.filter(c=>c.date.startsWith(filterMonth));

  // ── Product toggle ──
  const toggleProduct = (id) => {
    setConfig(p => ({...p, products: p.products.includes(id) ? p.products.filter(x=>x!==id) : [...p.products, id]}));
  };

  // ── GENERATE STRATEGY (Step 1 → 2) ──
  const generateStrategy = useCallback(async () => {
    setStep(1);
    const last8 = CAMPAIGNS.slice(-8);
    const bestCR = [...CAMPAIGNS].sort((a,b)=>b.cr-a.cr).slice(0,8);
    const bestRev = [...CAMPAIGNS].sort((a,b)=>b.rev-a.rev).slice(0,5);
    const selectedProds = config.products.map(id => ACTIVE_PRODUCTS.find(p=>p.id===id)).filter(Boolean);

    const sysPrompt = `Sei il copywriter strategico di Occhiale Matto, brand italiano urban di occhiali da sole (€24.99-€59.99). Stile: provocatorio, diretto, frasi corte a effetto. Mai aziendalese. Dare del "tu".

DATI PERFORMANCE REALI:
- Subject ≤22 char: OR medio 69.1%, Rev medio €274
- Subject vaghe ("Lo sapevi?", "Uno, sempre giusto!"): CR <1%, Rev <€150
- Pattern "[Nome] è arrivato!": media CR 1.57%, Rev €274
- Email multi-prodotto: Rev medio €301 vs €204 singolo (+48%)
- TOP CR: ${bestCR.slice(0,5).map(c=>`"${c.subject}" ${c.cr}%`).join(", ")}
- TOP REV: ${bestRev.map(c=>`"${c.subject}" €${Math.round(c.rev)}`).join(", ")}
- ULTIME 8: ${last8.map(c=>`${c.date.slice(5)}: "${c.subject}" tipo:${c.type} CR:${c.cr}% €${Math.round(c.rev)}`).join(" | ")}
- PROBLEMA ATTUALE: CR aprile 0.90% (in calo da 1.4%). Servono subject con hook forte e email con più prodotti cliccabili.
${selectedProds.length > 0 ? `\nPRODOTTI SELEZIONATI: ${selectedProds.map(p=>`${p.name} €${p.price}`).join(", ")}` : ""}

Rispondi SOLO in JSON valido senza backtick. Struttura:
{
  "recommendation": "2-3 frasi su perché questo tipo di email adesso",
  "subjects": [
    {"subject": "max 22 char, con hook forte", "preview": "preview text 40-60 char", "rationale": "perché funzionerà", "score": 85},
    {"subject": "...", "preview": "...", "rationale": "...", "score": 80},
    {"subject": "...", "preview": "...", "rationale": "...", "score": 75}
  ],
  "email_structure": "descrizione sezioni email (hero, griglia prodotti, CTA, etc)",
  "products_suggestion": "quali prodotti mettere e perché",
  "headline": "headline hero provocatoria in CAPS",
  "subheadline": "sottotitolo 2 righe max",
  "best_day": "mercoledì o giovedì, con orario",
  "warnings": ["avvisi basati sui trend"]
}`;

    const typeLabel = TYPE_LABELS[config.type] || config.type;
    const userPrompt = `Genera proposta per email tipo: ${typeLabel}.${config.focus ? ` Focus: ${config.focus}.` : ""}${config.notes ? ` Note: ${config.notes}.` : ""}${selectedProds.length > 0 ? ` Prodotti scelti: ${selectedProds.map(p=>p.name).join(", ")}.` : ""} Le ultime 5 email hanno CR medio 0.90%. Serve invertire il trend.`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "strategy",
          emailType: TYPE_LABELS[config.type] || config.type,
          selectedProducts: selectedProds,
          recentCampaigns: last8.map(c => ({
            name: c.subject,
            subject: c.subject,
            sendDate: c.date,
            weekday: new Date(c.date).toLocaleDateString("en-US", { weekday: "long" }),
            recipients: 0,
            opens: 0,
            openRate: c.or,
            clicks: 0,
            clickRate: c.cr,
            orders: c.orders,
            revenue: c.rev,
            unsubscribes: c.unsub
          })),
          topPerformers: bestRev.map(c => ({
            name: c.subject,
            subject: c.subject,
            sendDate: c.date,
            weekday: "",
            recipients: 0,
            opens: 0,
            openRate: c.or,
            clicks: 0,
            clickRate: c.cr,
            orders: c.orders,
            revenue: c.rev,
            unsubscribes: c.unsub
          })),
          focus: config.focus,
          notes: config.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      // Normalize server response to match the legacy UI shape
      const normalized = {
        recommendation: data.strategy?.hook || "Strategia generata in base ai pattern vincenti",
        subjects: (data.subjects || []).map((s: any) => ({
          subject: s.text,
          preview: s.preview,
          rationale: s.rationale,
          score: s.score
        })),
        email_structure: data.strategy?.emailStructure || "",
        products_suggestion: "",
        headline: (data.subjects?.[0]?.text || "").toUpperCase(),
        subheadline: data.strategy?.hook || "",
        best_day: data.strategy?.recommendedDay || "Thursday",
        warnings: data.strategy?.warnings || []
      };
      setResult(normalized);
      setStep(2);
    } catch(e: any) {
      setResult({ recommendation:`Errore: ${e.message}`, subjects:[], warnings:[e.message] });
      setStep(2);
    }
  }, [config]);

  // ── GENERATE HTML (Step 2 → 3) ──
  const generateHtml = useCallback(async (overrideIndex?: number) => {
    // Accept either a direct index (fresh click) or read from state
    const idx = typeof overrideIndex === "number" ? overrideIndex : selectedSubject;
    if (idx === null || idx === undefined || !result) return;
    if (!result.subjects || !result.subjects[idx]) return;

    // Sync state so UI shows correct subject
    if (idx !== selectedSubject) setSelectedSubject(idx);
    setHtmlStep(1);

    const subj = result.subjects[idx];
    const selectedProds = config.products.map(id => ACTIVE_PRODUCTS.find(p=>p.id===id)).filter(Boolean);
    const prodsToUse = selectedProds.length > 0 ? selectedProds : ACTIVE_PRODUCTS.slice(0,6);

    // 4-minute timeout via AbortController — prevents UI from hanging forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode: "html",
          emailType: TYPE_LABELS[config.type] || config.type,
          chosenSubject: subj.subject,
          chosenPreview: subj.preview,
          strategy: result.email_structure || result.recommendation || "",
          selectedProducts: prodsToUse.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            url: p.url,
            img: p.img,
            isNew: !!p.new
          })),
          recentCampaigns: []
        })
      });
      clearTimeout(timeoutId);

      // Robust response parsing — never assume JSON
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0,120)}`);
      }

      if (!res.ok) throw new Error(data.error || `HTML generation failed (${res.status})`);
      if (!data.html) throw new Error("Response OK but no HTML returned");

      setHtmlOutput(data.html);
      setHtmlStep(2);
    } catch(e: any) {
      clearTimeout(timeoutId);
      const msg = e.name === "AbortError"
        ? "Timeout: la generazione ha superato i 4 minuti. Riprova."
        : e.message || "Errore sconosciuto";
      setHtmlOutput(`<!-- Errore: ${msg} -->\n<div style="padding:40px;font-family:monospace;color:#d64545;background:#faf7f2;">\n<h3>Errore durante la generazione</h3>\n<p>${msg}</p>\n<p style="color:#5a5a5a;font-size:12px;">Clicca "Rigenera HTML" per riprovare.</p>\n</div>`);
      setHtmlStep(2);
    }
  }, [selectedSubject, result, config, ACTIVE_PRODUCTS]);

  const copyHtml = () => {
    navigator.clipboard?.writeText(htmlOutput);
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  // ── Styles ──
  const S = {
    tab: (a) => ({ display:"flex", alignItems:"center", gap:"6px", padding:"10px 16px", fontSize:"12px", fontWeight:a?700:400, color:a?"#b8924a":"#9a9089", background:a?"#b8924a0a":"transparent", border:"none", borderBottom:a?"2px solid #b8924a":"2px solid transparent", cursor:"pointer", fontFamily:"inherit", letterSpacing:"0.3px", transition:"all 0.15s" }),
    sec: { background:"#faf7f2", border:"1px solid #e8ddd0", borderRadius:"10px", padding:"18px", marginBottom:"14px" },
    secTitle: { fontSize:"10px", color:"#9a9089", textTransform:"uppercase", letterSpacing:"2px", marginBottom:"12px", fontWeight:600 },
    btn: (active,color="#b8924a") => ({ padding:"7px 14px", borderRadius:"7px", fontSize:"11px", fontWeight:600, background:active?color+"1a":"#f5f1ea", color:active?color:"#9a9089", border:`1px solid ${active?color+"44":"#e8ddd0"}`, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }),
    goldBtn: { padding:"12px 24px", background:"linear-gradient(135deg,#b8924a,#8a6630)", color:"#ffffff", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:800, cursor:"pointer", fontFamily:"inherit", letterSpacing:"0.5px", display:"flex", alignItems:"center", gap:"8px" },
  };

  return (
    <div style={{ fontFamily:"'DM Sans',-apple-system,sans-serif", background:"#faf7f2", color:"#1a1a1a", minHeight:"100vh" }}>
      {/* HEADER */}
      <div style={{ padding:"16px 20px 0", borderBottom:"1px solid #e8ddd0", background:"#ffffff" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px", maxWidth:"1100px", margin:"0 auto 12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:"linear-gradient(135deg,#b8924a,#6b4f0f)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:900, color:"#ffffff" }}>OM</div>
            <div>
              <div style={{ fontSize:"14px", fontWeight:700, letterSpacing:"0.5px" }}>OCCHIALE MATTO</div>
              <div style={{ fontSize:"9px", color:"#7a7a7a", letterSpacing:"2px" }}>EMAIL INTELLIGENCE v2</div>
            </div>
          </div>
          <div style={{ fontSize:"9px", color:"#5a5a5a", padding:"4px 10px", border:"1px solid #e8ddd0", borderRadius:"5px" }}>
            {CAMPAIGNS.length} campagne · {ACTIVE_PRODUCTS.length} prodotti{liveProducts ? " live" : ""}
          </div>
        </div>
        <div style={{ display:"flex", maxWidth:"1100px", margin:"0 auto" }}>
          <button style={S.tab(tab==="dashboard")} onClick={()=>setTab("dashboard")}>{I.dash} Dashboard</button>
          <button style={S.tab(tab==="generator")} onClick={()=>{setTab("generator");setStep(0);setResult(null);setHtmlStep(0);setHtmlOutput("");setSelectedSubject(null);}}>{I.spark} Generatore</button>
          <button style={S.tab(tab==="campaigns")} onClick={()=>setTab("campaigns")}>{I.list} Campagne</button>
        </div>
      </div>

      <div style={{ padding:"18px 20px", maxWidth:"1100px", margin:"0 auto" }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab==="dashboard" && (<div>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"14px" }}>
            <Kpi label="Open Rate" value={`${fmtPct(avgOr5)}%`} trend={tOr} color="#1a9d94" sub="media ultime 5" spark={<Spark data={CAMPAIGNS.slice(-12).map(c=>c.or)} color="#1a9d94"/>}/>
            <Kpi label="Click Rate" value={`${fmtPct(avgCr5)}%`} trend={tCr} color={avgCr5<1?"#d64545":"#b8924a"} sub="media ultime 5" spark={<Spark data={CAMPAIGNS.slice(-12).map(c=>c.cr)} color={avgCr5<1?"#d64545":"#b8924a"}/>}/>
            <Kpi label="Rev medio" value={`€${Math.round(avgRev5)}`} trend={tRev} color="#b8924a" sub="media ultime 5" spark={<Spark data={CAMPAIGNS.slice(-12).map(c=>c.rev)} color="#b8924a"/>}/>
            <Kpi label="Totale" value={`€${(totalRev/1000).toFixed(1)}k`} color="#7c5cd4" sub={`${totalOrd} ordini`}/>
          </div>

          {avgCr5 < 1.2 && (
            <div style={{ background:"#d645450a", border:"1px solid #d6454522", borderRadius:"8px", padding:"12px 16px", marginBottom:"14px", display:"flex", gap:"10px" }}>
              <span style={{ color:"#d64545", marginTop:"1px" }}>{I.alert}</span>
              <div style={{ fontSize:"12px", color:"#5a5a5a", lineHeight:1.5 }}>
                <b style={{color:"#d64545"}}>CR in calo critico: {fmtPct(avgCr5)}%</b> — Le multi-prodotto hanno CR 1.53% vs 0.90% attuale. Servono più prodotti cliccabili e subject con hook.
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
            <div style={S.sec}>
              <div style={S.secTitle}>Revenue mensile</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height:"120px" }}>
                {months.map((m,i) => {
                  const mx = Math.max(...months.map(x=>x.rev))*1.1;
                  const h = mx>0?(m.rev/mx)*100:0;
                  return (<div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
                    <span style={{ fontSize:"8px", color:"#5a5a5a" }}>€{Math.round(m.rev)}</span>
                    <div style={{ width:"100%", height:`${h}px`, background:`linear-gradient(180deg,#b8924a,#b8924a66)`, borderRadius:"3px 3px 1px 1px", minHeight:"2px" }}/>
                    <span style={{ fontSize:"8px", color:"#9a9089" }}>{m.label}</span>
                  </div>);
                })}
              </div>
            </div>
            <div style={S.sec}>
              <div style={S.secTitle}>Per tipologia (rev medio)</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {typePerf.slice(0,5).map(t => (
                  <div key={t.type} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ width:"60px", fontSize:"9px", color:TYPE_COLORS[t.type], fontWeight:700, textTransform:"uppercase" }}>{TYPE_LABELS[t.type]?.slice(0,8)}</span>
                    <div style={{ flex:1, height:"16px", background:"#e8ddd0", borderRadius:"3px", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(t.avgRev/400)*100}%`, background:TYPE_COLORS[t.type], borderRadius:"3px", maxWidth:"100%" }}/>
                    </div>
                    <span style={{ fontSize:"11px", color:"#2a2a2a", fontFamily:"'Space Mono',monospace", width:"50px", textAlign:"right" }}>€{Math.round(t.avgRev)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={S.sec}>
            <div style={S.secTitle}>Ultime 8 campagne</div>
            {CAMPAIGNS.slice(-8).reverse().map((c,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"60px 1fr 60px 55px 60px", gap:"8px", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #e8ddd0", fontSize:"11px" }}>
                <span style={{ color:"#7a7a7a", fontFamily:"'Space Mono',monospace", fontSize:"10px" }}>{c.date.slice(5)}</span>
                <div style={{ display:"flex", alignItems:"center", gap:"6px", overflow:"hidden" }}>
                  <span style={{ fontSize:"7px", padding:"2px 5px", borderRadius:"3px", background:TYPE_COLORS[c.type]+"1a", color:TYPE_COLORS[c.type], fontWeight:700 }}>{TYPE_LABELS[c.type]?.slice(0,5)}</span>
                  <span style={{ color:"#3a3a3a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.subject}</span>
                </div>
                <span style={{ textAlign:"right", color:c.or>=68?"#1a9d94":"#5a5a5a", fontFamily:"'Space Mono',monospace" }}>{fmtPct(c.or)}%</span>
                <span style={{ textAlign:"right", color:c.cr>=1.5?"#1a9d94":c.cr<1?"#d64545":"#5a5a5a", fontFamily:"'Space Mono',monospace" }}>{fmtPct(c.cr)}%</span>
                <span style={{ textAlign:"right", color:"#b8924a", fontWeight:700, fontFamily:"'Space Mono',monospace" }}>€{Math.round(c.rev)}</span>
              </div>
            ))}
          </div>
        </div>)}

        {/* ═══ GENERATOR ═══ */}
        {tab==="generator" && (<div>

          {/* STEP 0: Config */}
          {step===0 && (<div>
            {/* Context */}
            <div style={{ ...S.sec, background:"#ffffff" }}>
              <div style={S.secTitle}>Contesto — ultime 4 email</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"8px" }}>
                {CAMPAIGNS.slice(-4).map((c,i) => (
                  <div key={i} style={{ padding:"10px", borderRadius:"7px", background:"#f5f1ea", border:"1px solid #e8ddd0" }}>
                    <div style={{ fontSize:"9px", color:"#7a7a7a", marginBottom:"3px" }}>{c.date.slice(5)} · {TYPE_LABELS[c.type]}</div>
                    <div style={{ fontSize:"11px", color:"#2a2a2a", fontWeight:600, marginBottom:"4px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>"{c.subject}"</div>
                    <div style={{ display:"flex", gap:"8px", fontSize:"10px" }}>
                      <span style={{ color:c.cr>=1.2?"#1a9d94":"#d64545" }}>CR {fmtPct(c.cr)}%</span>
                      <span style={{ color:"#b8924a" }}>€{Math.round(c.rev)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.sec}>
              <div style={S.secTitle}>{I.spark} Configura email</div>
              
              {/* AI Suggestion */}
              <div style={{ background:"#b8924a08", border:"1px solid #b8924a1a", borderRadius:"7px", padding:"10px 14px", marginBottom:"14px", fontSize:"11px" }}>
                <span style={{ color:"#b8924a", fontWeight:700 }}>AI:</span>
                <span style={{ color:"#6a6a6a", marginLeft:"6px" }}>
                  Consiglio <b style={{color:"#1a1a1a"}}>{TYPE_LABELS[suggestedType]}</b> (rev medio €{Math.round(typePerf.find(t=>t.type===suggestedType)?.avgRev||0)}).
                  {avgCr5<1.2 && " CR in calo: più prodotti cliccabili."}
                </span>
              </div>

              {/* Type */}
              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontSize:"10px", color:"#7a7a7a", display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"1px" }}>Tipo email</label>
                <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                  {Object.entries(TYPE_LABELS).map(([k,v]) => (
                    <button key={k} onClick={()=>setConfig(p=>({...p,type:k}))} style={S.btn(config.type===k,TYPE_COLORS[k])}>{v}</button>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div style={{ marginBottom:"14px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
                  <label style={{ fontSize:"10px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px" }}>Prodotti ({config.products.length} selezionati)</label>
                  <button onClick={()=>setShowProductPicker(!showProductPicker)} style={{ ...S.btn(showProductPicker), fontSize:"10px", padding:"4px 10px", display:"flex", alignItems:"center", gap:"4px" }}>
                    {showProductPicker ? <>{I.x} Chiudi</> : <>{I.plus} Scegli prodotti</>}
                  </button>
                </div>
                
                {showProductPicker && (
                  <div style={{ background:"#f5f1ea", border:"1px solid #e8ddd0", borderRadius:"8px", padding:"12px", maxHeight:"200px", overflowY:"auto" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:"4px" }}>
                      {ACTIVE_PRODUCTS.map(p => {
                        const sel = config.products.includes(p.id);
                        return (
                          <button key={p.id} onClick={()=>toggleProduct(p.id)} style={{
                            padding:"6px 8px", borderRadius:"5px", fontSize:"10px", textAlign:"left",
                            background:sel?"#b8924a15":"transparent", border:`1px solid ${sel?"#b8924a44":"#e8ddd0"}`,
                            color:sel?"#b8924a":"#7a7a7a", cursor:"pointer", fontFamily:"inherit",
                            display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.1s"
                          }}>
                            <span>{p.name}{p.new?" ✦":""}</span>
                            <span style={{ fontSize:"9px", color:"#9a9089" }}>€{p.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {config.products.length > 0 && !showProductPicker && (
                  <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                    {config.products.map(id => {
                      const p = PRODUCTS.find(x=>x.id===id);
                      return p ? (
                        <span key={id} style={{ fontSize:"10px", padding:"3px 8px", borderRadius:"4px", background:"#b8924a15", color:"#b8924a", display:"flex", alignItems:"center", gap:"4px" }}>
                          {p.name} <button onClick={()=>toggleProduct(id)} style={{ background:"none", border:"none", color:"#b8924a88", cursor:"pointer", padding:0, fontSize:"10px" }}>×</button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Focus & Notes */}
              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontSize:"10px", color:"#7a7a7a", display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"1px" }}>Focus / tema (opzionale)</label>
                <input type="text" placeholder="es. estate, fotocromatici, look urban..." value={config.focus} onChange={e=>setConfig(p=>({...p,focus:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", background:"#f5f1ea", border:"1px solid #e8ddd0", borderRadius:"7px", color:"#1a1a1a", fontSize:"12px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
              </div>
              <div style={{ marginBottom:"18px" }}>
                <label style={{ fontSize:"10px", color:"#7a7a7a", display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"1px" }}>Note (opzionale)</label>
                <textarea placeholder="es. promo 3x2 attiva, lancio nuova collezione..." value={config.notes} onChange={e=>setConfig(p=>({...p,notes:e.target.value}))} rows={2}
                  style={{ width:"100%", padding:"9px 12px", background:"#f5f1ea", border:"1px solid #e8ddd0", borderRadius:"7px", color:"#1a1a1a", fontSize:"12px", fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
              </div>

              <button onClick={generateStrategy} style={S.goldBtn}>{I.spark} GENERA STRATEGIA + SUBJECT</button>
            </div>
          </div>)}

          {/* STEP 1: Loading */}
          {step===1 && (
            <div style={{ ...S.sec, textAlign:"center", padding:"50px 20px" }}>
              <div style={{ width:"36px", height:"36px", border:"3px solid #e8ddd0", borderTopColor:"#b8924a", borderRadius:"50%", margin:"0 auto 16px", animation:"spin 1s linear infinite" }}/>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ fontSize:"13px", color:"#b8924a", fontWeight:600 }}>Claude analizza {CAMPAIGNS.length} campagne...</div>
              <div style={{ fontSize:"11px", color:"#7a7a7a", marginTop:"4px" }}>Calcolo pattern, CR, revenue per tipo</div>
            </div>
          )}

          {/* STEP 2: Strategy result + Subject selection */}
          {step===2 && result && htmlStep===0 && (
            <div>
              <div style={{ ...S.sec, borderLeft:"3px solid #b8924a" }}>
                <div style={S.secTitle}>{I.spark} Raccomandazione</div>
                <p style={{ fontSize:"12px", color:"#3a3a3a", lineHeight:1.6, margin:0 }}>{result.recommendation}</p>
              </div>

              {result.subjects?.length > 0 && (
                <div style={S.sec}>
                  <div style={S.secTitle}>Clicca la subject line preferita → parte la generazione HTML</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {result.subjects.map((s,i) => (
                      <button key={i} onClick={()=>generateHtml(i)} style={{
                        background: selectedSubject===i ? "#b8924a0f" : "#f5f1ea",
                        border: `1px solid ${selectedSubject===i ? "#b8924a44" : "#e8ddd0"}`,
                        borderRadius:"8px", padding:"14px 16px", textAlign:"left", cursor:"pointer",
                        fontFamily:"inherit", transition:"all 0.15s", position:"relative"
                      }}>
                        {s.score && <span style={{ position:"absolute", top:"8px", right:"12px", fontSize:"9px", padding:"2px 6px", borderRadius:"4px", background:s.score>=80?"#1a9d941a":"#b8924a1a", color:s.score>=80?"#1a9d94":"#b8924a", fontWeight:700 }}>{s.score}/100</span>}
                        <div style={{ fontSize:"9px", color:"#7a7a7a", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"1px" }}>Opzione {i+1} · {s.subject?.length || 0} char · clicca per generare</div>
                        <div style={{ fontSize:"15px", fontWeight:700, color:selectedSubject===i?"#b8924a":"#1a1a1a", marginBottom:"4px" }}>{s.subject}</div>
                        <div style={{ fontSize:"11px", color:"#7a7a7a", fontStyle:"italic", marginBottom:"4px" }}>Preview: {s.preview}</div>
                        <div style={{ fontSize:"10px", color:"#7a7a7a" }}>{s.rationale}</div>
                        {selectedSubject===i && <div style={{ position:"absolute", top:"50%", right:"16px", transform:"translateY(-50%)", color:"#b8924a" }}>{I.check}</div>}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop:"12px", fontSize:"10px", color:"#7a7a7a", textAlign:"center" }}>
                    Cliccando una subject si genera automaticamente l'HTML dell'email con {config.products.length || "6 default"} prodotti
                  </div>
                </div>
              )}

              {/* Extra info */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                {result.email_structure && <div style={S.sec}><div style={S.secTitle}>Struttura</div><p style={{ fontSize:"11px", color:"#5a5a5a", lineHeight:1.5, margin:0 }}>{result.email_structure}</p></div>}
                {result.products_suggestion && <div style={S.sec}><div style={S.secTitle}>Prodotti</div><p style={{ fontSize:"11px", color:"#5a5a5a", lineHeight:1.5, margin:0 }}>{result.products_suggestion}</p></div>}
              </div>

              <button onClick={()=>{setStep(0);setResult(null);setSelectedSubject(null);}} style={{ ...S.btn(false), marginTop:"8px", display:"flex", alignItems:"center", gap:"4px", fontSize:"11px" }}>← Riconfigura</button>
            </div>
          )}

          {/* HTML Generation loading */}
          {htmlStep===1 && (
            <div style={{ ...S.sec, textAlign:"center", padding:"50px 20px" }}>
              <div style={{ width:"36px", height:"36px", border:"3px solid #e8ddd0", borderTopColor:"#b8924a", borderRadius:"50%", margin:"0 auto 16px", animation:"spin 1s linear infinite" }}/>
              <div style={{ fontSize:"13px", color:"#b8924a", fontWeight:600 }}>Generazione HTML email in corso...</div>
              <div style={{ fontSize:"11px", color:"#7a7a7a", marginTop:"4px" }}>Template Occhiale Matto con {config.products.length || 6} prodotti, dark mode, CTA, mobile responsive</div>
            </div>
          )}

          {/* STEP 3: HTML Output */}
          {htmlStep===2 && htmlOutput && (
            <div>
              {/* Subject + Preview bar */}
              <div style={{ ...S.sec, display:"flex", gap:"16px", alignItems:"center", flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:"9px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px" }}>Subject</div>
                  <div style={{ fontSize:"14px", fontWeight:700, color:"#b8924a" }}>{result?.subjects?.[selectedSubject]?.subject || "—"}</div>
                </div>
                <div style={{ width:"1px", height:"30px", background:"#e8ddd0" }}/>
                <div>
                  <div style={{ fontSize:"9px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px" }}>Preview</div>
                  <div style={{ fontSize:"12px", color:"#5a5a5a" }}>{result?.subjects?.[selectedSubject]?.preview || "—"}</div>
                </div>
              </div>

              {/* View toggle + Copy */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <div style={{ display:"flex", gap:"4px" }}>
                  <button onClick={()=>setViewMode("preview")} style={S.btn(viewMode==="preview")}>{I.eye} Desktop</button>
                  <button onClick={()=>setViewMode("mobile")} style={S.btn(viewMode==="mobile")}>📱 Mobile</button>
                  <button onClick={()=>setViewMode("code")} style={S.btn(viewMode==="code")}>{I.code} Codice HTML</button>
                </div>
                <button onClick={copyHtml} style={{ ...S.goldBtn, fontSize:"12px", padding:"8px 18px" }}>
                  {copied ? <>{I.check} Copiato!</> : <>{I.copy} Copia HTML</>}
                </button>
              </div>

              {/* Output */}
              {viewMode==="code" ? (
                <div style={{ ...S.sec, padding:0 }}>
                  <pre style={{ margin:0, padding:"16px", fontSize:"10px", color:"#5a5a5a", fontFamily:"'Space Mono',monospace", overflowX:"auto", maxHeight:"600px", overflowY:"auto", lineHeight:1.5, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>{htmlOutput}</pre>
                </div>
              ) : (
                <div style={{ ...S.sec, padding:0, overflow:"hidden", display:"flex", justifyContent:"center", background: viewMode==="mobile" ? "#faf7f2" : "transparent" }}>
                  <iframe
                    srcDoc={htmlOutput}
                    style={{
                      width: viewMode==="mobile" ? "390px" : "100%",
                      maxWidth: viewMode==="mobile" ? "390px" : "100%",
                      height: viewMode==="mobile" ? "780px" : "700px",
                      border: viewMode==="mobile" ? "8px solid #e8ddd0" : "none",
                      borderRadius: viewMode==="mobile" ? "28px" : "10px",
                      background: "#e8ddd0",
                      margin: viewMode==="mobile" ? "16px 0" : "0"
                    }}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}

              {/* Actions */}
              <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
                <button onClick={()=>{setHtmlStep(0);setSelectedSubject(null);}} style={{ ...S.btn(false), display:"flex", alignItems:"center", gap:"4px" }}>← Cambia subject</button>
                <button onClick={()=>{setStep(0);setResult(null);setHtmlStep(0);setHtmlOutput("");setSelectedSubject(null);}} style={{ ...S.btn(false), display:"flex", alignItems:"center", gap:"4px" }}>← Nuova email</button>
                <button onClick={()=>generateHtml()} style={{ ...S.btn(false), display:"flex", alignItems:"center", gap:"4px" }}>↻ Rigenera HTML</button>
              </div>
            </div>
          )}
        </div>)}

        {/* ═══ CAMPAIGNS ═══ */}
        {tab==="campaigns" && (<div>
          <div style={{ display:"flex", gap:"4px", marginBottom:"12px", flexWrap:"wrap" }}>
            <button onClick={()=>setFilterMonth("all")} style={S.btn(filterMonth==="all")}>Tutte ({CAMPAIGNS.length})</button>
            {months.map(m => <button key={m.key} onClick={()=>setFilterMonth(m.key)} style={S.btn(filterMonth===m.key)}>{m.label} ({m.n})</button>)}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"60px 1fr 56px 50px 45px 56px 40px", gap:"6px", padding:"6px 12px", fontSize:"9px", color:"#5a5a5a", textTransform:"uppercase", letterSpacing:"1px", borderBottom:"1px solid #e8ddd0" }}>
            <span>Data</span><span>Subject</span><span style={{textAlign:"right"}}>OR</span><span style={{textAlign:"right"}}>CR</span><span style={{textAlign:"right"}}>Ord</span><span style={{textAlign:"right"}}>Rev</span><span style={{textAlign:"right"}}>Uns</span>
          </div>

          <div style={{ maxHeight:"440px", overflowY:"auto" }}>
            {[...filtered].reverse().map((c,i) => (
              <div key={i} style={{
                display:"grid", gridTemplateColumns:"60px 1fr 56px 50px 45px 56px 40px",
                gap:"6px", alignItems:"center", padding:"8px 12px", fontSize:"11px",
                background:i%2===0?"#ffffff":"transparent", borderLeft:`2px solid ${TYPE_COLORS[c.type]||"#d4c8b8"}`,
                transition:"background 0.1s"
              }}
              onMouseEnter={e=>e.currentTarget.style.background="#e8ddd0"}
              onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#ffffff":"transparent"}
              >
                <span style={{ color:"#7a7a7a", fontFamily:"'Space Mono',monospace", fontSize:"10px" }}>{c.date.slice(5)}</span>
                <div style={{ display:"flex", alignItems:"center", gap:"5px", overflow:"hidden" }}>
                  <span style={{ fontSize:"7px", padding:"1px 4px", borderRadius:"2px", background:TYPE_COLORS[c.type]+"15", color:TYPE_COLORS[c.type], fontWeight:700, whiteSpace:"nowrap" }}>{TYPE_LABELS[c.type]?.slice(0,5)}</span>
                  <span style={{ color:"#3a3a3a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.subject}</span>
                  {c.html && <span style={{ fontSize:"6px", padding:"1px 3px", borderRadius:"2px", background:"#b8924a22", color:"#b8924a", fontWeight:700 }}>HTML</span>}
                </div>
                <span style={{ textAlign:"right", color:c.or>=70?"#1a9d94":"#6a6a6a", fontFamily:"'Space Mono',monospace" }}>{fmtPct(c.or)}%</span>
                <span style={{ textAlign:"right", color:c.cr>=1.5?"#1a9d94":c.cr<1?"#d64545":"#6a6a6a", fontFamily:"'Space Mono',monospace" }}>{fmtPct(c.cr)}%</span>
                <span style={{ textAlign:"right", color:c.orders>=7?"#1a9d94":"#6a6a6a", fontFamily:"'Space Mono',monospace" }}>{c.orders}</span>
                <span style={{ textAlign:"right", color:"#b8924a", fontWeight:700, fontFamily:"'Space Mono',monospace" }}>€{Math.round(c.rev)}</span>
                <span style={{ textAlign:"right", color:c.unsub>15?"#d64545":"#c4b8a8", fontSize:"10px" }}>{c.unsub}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop:"10px", padding:"10px 14px", background:"#faf7f2", borderRadius:"7px", display:"flex", gap:"16px", fontSize:"11px", color:"#9a9089", flexWrap:"wrap" }}>
            <span>{filtered.length} email</span>
            <span>OR: <b style={{color:"#1a1a1a"}}>{fmtPct(avg(filtered,"or"))}%</b></span>
            <span>CR: <b style={{color:"#1a1a1a"}}>{fmtPct(avg(filtered,"cr"))}%</b></span>
            <span>Rev: <b style={{color:"#b8924a"}}>€{Math.round(filtered.reduce((s,c)=>s+c.rev,0))}</b></span>
            <span>Ordini: <b style={{color:"#1a1a1a"}}>{filtered.reduce((s,c)=>s+c.orders,0)}</b></span>
          </div>
        </div>)}
      </div>
    </div>
  );
}
