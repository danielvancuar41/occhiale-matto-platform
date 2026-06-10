"use client";
// @ts-nocheck — legacy v2 component, incremental typing to follow

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// OCCHIALE MATTO — EMAIL MARKETING INTELLIGENCE PLATFORM v2
// Full HTML Generator + Product Catalog + Analytics
// All AI calls go through /api/generate (server-side, keys protected)
// Live data: /api/catalog (Shopify scraper) + /api/klaviyo (campaigns)
// ═══════════════════════════════════════════════════════════════════

// ── PRODUCT CATALOG (fallback if scraper fails — manually synced) ──
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

// ── CAMPAIGN DATA (FALLBACK ONLY — Klaviyo overrides this when available) ──
const CAMPAIGNS_FALLBACK = [
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

// ── TEMPLATE STYLES (visual aesthetics for HTML generator) ──
const TEMPLATE_OPTIONS = [
  { id:"classico", label:"Classico", desc:"Identità OM storica, griglia, oro, sezioni alternate" },
  { id:"minimal", label:"Minimal", desc:"Pulito, ariato, prodotto-centrico, niente decorazioni" },
  { id:"bold", label:"Bold", desc:"Tipografia gigante, contrasti forti, vibe drop/urgenza" },
  { id:"editorial", label:"Editorial", desc:"Magazine-style, foto piene, serif elegante" },
];

// ── COLOR MODES (light/dark for HTML output) ──
const COLOR_MODES = [
  { id:"light", label:"Chiaro", bg:"#faf7f2", text:"#1a1a1a", accent:"#b8924a" },
  { id:"dark", label:"Scuro", bg:"#1a1a1a", text:"#faf7f2", accent:"#b8924a" },
];

const fmtPct = n => n?.toFixed?.(1) ?? "0.0";

// localStorage cache key for Klaviyo data
const KLAVIYO_CACHE_KEY = "om_klaviyo_campaigns_v1";
const KLAVIYO_CACHE_AT_KEY = "om_klaviyo_fetched_at_v1";

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
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 0 1 15.5-6.36L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.36L3 16"/><path d="M3 21v-5h5"/></svg>,
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

// ── ADV numeric input field ──
function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize:"9px", color:"#9a9089", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"3px" }}>{label}</label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        style={{
          width:"100%", padding:"7px 9px", fontSize:"12px",
          border:"1px solid #e8ddd0", borderRadius:"5px",
          background:"#ffffff", color:"#1a1a1a", outline:"none",
          fontFamily:"'Space Mono', monospace"
        }}
        onFocus={e => e.currentTarget.style.borderColor = "#b8924a"}
        onBlur={e => e.currentTarget.style.borderColor = "#e8ddd0"}
      />
    </div>
  );
}

// ── ADV KPI Card (compact, with delta) ──
function AdvKpiCard({ label, value, delta, invertDelta = false, highlight }: {
  label: string;
  value: string;
  delta: { val: number; label: string; color: string } | null;
  invertDelta?: boolean; // if true (e.g. for "spesa"), positive delta is bad
  highlight?: "good" | "bad" | "warn" | "neutral";
}) {
  // Adjust delta color if invertDelta
  let deltaColor = delta?.color;
  if (delta && invertDelta) {
    deltaColor = delta.val > 0 ? "#d64545" : delta.val < 0 ? "#1a9d94" : "#7a7a7a";
  }
  const borderColor =
    highlight === "good" ? "#1a9d94" :
    highlight === "bad" ? "#d64545" :
    highlight === "warn" ? "#b8924a" : "#e8ddd0";
  return (
    <div style={{
      padding:"12px 14px",
      background:"#ffffff",
      border:`1px solid ${borderColor}`,
      borderRadius:"8px",
      borderLeftWidth: highlight && highlight !== "neutral" ? "3px" : "1px"
    }}>
      <div style={{ fontSize:"10px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px", fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:"18px", fontWeight:700, color:"#1a1a1a", fontFamily:"'Space Mono', monospace" }}>{value}</div>
      {delta && (
        <div style={{ fontSize:"10px", color:deltaColor, marginTop:"3px", fontWeight:600 }}>{delta.label}</div>
      )}
    </div>
  );
}

// ── Preview block for extracted ADV data (shown in autofill section) ──
function PreviewBlock({ title, data }: { title: string; data: any[][] }) {
  const visible = data.filter(([_, v]) => v != null && v !== 0 && v !== "0" && v !== "");
  return (
    <div style={{ padding:"8px 10px", background:"#faf7f2", borderRadius:"6px", border:"1px solid #f0e8d8" }}>
      <div style={{ fontSize:"10px", fontWeight:700, color:"#1a1a1a", marginBottom:"4px" }}>{title}</div>
      {visible.length === 0 ? (
        <div style={{ fontSize:"10px", color:"#9a9089", fontStyle:"italic" }}>(nessun dato)</div>
      ) : (
        visible.map(([k, v], i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:"#3a3a3a", padding:"1px 0" }}>
            <span>{k}:</span>
            <b style={{ color:"#1a1a1a", fontFamily:"'Space Mono', monospace" }}>{v}</b>
          </div>
        ))
      )}
    </div>
  );
}

// ── Theory section block (collapsible-ready) ──
function TheorySection({ title, children }: { title: string; children: any }) {
  return (
    <div style={{ marginBottom:"20px", padding:"16px 20px", background:"#ffffff", border:"1px solid #e8ddd0", borderRadius:"10px" }}>
      <div style={{ fontSize:"13px", fontWeight:700, color:"#1a1a1a", marginBottom:"10px" }}>{title}</div>
      <div style={{ fontSize:"12px", lineHeight:1.6, color:"#3a3a3a" }}>
        {children}
      </div>
    </div>
  );
}

// Helper: format ago time for "Aggiornato 2h fa"
function formatAgo(iso?: string): string {
  if (!iso) return "mai";
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 1) return "ora";
    if (min < 60) return `${min}m fa`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h fa`;
    const d = Math.floor(h / 24);
    return `${d}g fa`;
  } catch { return "mai"; }
}

// ── ADV HELPERS ──
function emptyAdvForm() {
  const now = new Date();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  return {
    week_number: "",
    week_label: "",
    week_start: lastMonday.toISOString().slice(0, 10),
    week_end: lastSunday.toISOString().slice(0, 10),
    notes: "",
    acq_spesa: "", acq_impression: "", acq_click: "", acq_acquisti: "", acq_revenue: "",
    ret_spesa: "", ret_impression: "", ret_click: "", ret_acquisti: "", ret_revenue: "",
    tra_spesa: "", tra_impression: "", tra_click: ""
  };
}

function deriveAdvKPIs(w: any) {
  if (!w) return null;
  const n = (v: any) => Number(v) || 0;
  const acq_spesa = n(w.acq_spesa), acq_acquisti = n(w.acq_acquisti), acq_revenue = n(w.acq_revenue);
  const acq_impression = n(w.acq_impression), acq_click = n(w.acq_click);
  const ret_spesa = n(w.ret_spesa), ret_acquisti = n(w.ret_acquisti), ret_revenue = n(w.ret_revenue);
  const ret_impression = n(w.ret_impression), ret_click = n(w.ret_click);
  const tra_spesa = n(w.tra_spesa), tra_impression = n(w.tra_impression), tra_click = n(w.tra_click);
  return {
    acq_cpa: acq_acquisti > 0 ? acq_spesa / acq_acquisti : 0,
    acq_roas: acq_spesa > 0 ? acq_revenue / acq_spesa : 0,
    acq_ctr: acq_impression > 0 ? (acq_click / acq_impression) * 100 : 0,
    acq_cpc: acq_click > 0 ? acq_spesa / acq_click : 0,
    ret_cpa: ret_acquisti > 0 ? ret_spesa / ret_acquisti : 0,
    ret_roas: ret_spesa > 0 ? ret_revenue / ret_spesa : 0,
    ret_ctr: ret_impression > 0 ? (ret_click / ret_impression) * 100 : 0,
    ret_cpc: ret_click > 0 ? ret_spesa / ret_click : 0,
    tra_ctr: tra_impression > 0 ? (tra_click / tra_impression) * 100 : 0,
    tra_cpc: tra_click > 0 ? tra_spesa / tra_click : 0,
    total_spesa: acq_spesa + ret_spesa + tra_spesa,
    total_revenue: acq_revenue + ret_revenue,
    total_acquisti: acq_acquisti + ret_acquisti,
    total_roas: (acq_spesa + ret_spesa + tra_spesa) > 0 ? (acq_revenue + ret_revenue) / (acq_spesa + ret_spesa + tra_spesa) : 0
  };
}

function deltaPct(curr: number, prev: number): { val: number; label: string; color: string } | null {
  if (!prev || prev === 0) return null;
  const d = ((curr - prev) / prev) * 100;
  const color = d > 0 ? "#1a9d94" : d < 0 ? "#d64545" : "#7a7a7a";
  const arrow = d > 0 ? "↑" : d < 0 ? "↓" : "→";
  return { val: d, label: `${arrow} ${d > 0 ? "+" : ""}${d.toFixed(1)}%`, color };
}

function fmtEuro(n: number): string {
  return n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [config, setConfig] = useState({ type:"multi", focus:"", notes:"", products:[], templateStyle:"classico", colorMode:"light" });
  const [htmlOutput, setHtmlOutput] = useState("");
  const [htmlStep, setHtmlStep] = useState(0); // 0=not started, 1=generating, 2=done
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [viewMode, setViewMode] = useState("preview"); // preview | mobile | code
  const [copied, setCopied] = useState(false);
  const [filterMonth, setFilterMonth] = useState("all");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [liveProducts, setLiveProducts] = useState(null); // null = not loaded yet, array = loaded
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Klaviyo state
  const [liveCampaigns, setLiveCampaigns] = useState<any[] | null>(null);
  const [klaviyoLoading, setKlaviyoLoading] = useState(false);
  const [klaviyoError, setKlaviyoError] = useState<string | null>(null);
  const [klaviyoFetchedAt, setKlaviyoFetchedAt] = useState<string | null>(null);

  // ── ADV (Meta Ads weekly reports) ──
  const [advWeeks, setAdvWeeks] = useState<any[] | null>(null); // null = not loaded
  const [advLoading, setAdvLoading] = useState(false);
  const [advError, setAdvError] = useState<string | null>(null);
  const [advSelectedId, setAdvSelectedId] = useState<string | null>(null);
  const [advSubTab, setAdvSubTab] = useState<"week" | "compare" | "trend" | "diagnosi" | "teoria">("week");
  const [advShowForm, setAdvShowForm] = useState(false);
  const [advEditingId, setAdvEditingId] = useState<string | null>(null);
  const [advDiagnosing, setAdvDiagnosing] = useState(false);
  const [advDiagnoseFocus, setAdvDiagnoseFocus] = useState("");
  const [advCompareIds, setAdvCompareIds] = useState<string[]>([]);
  const [advForm, setAdvForm] = useState<any>(emptyAdvForm());
  const [advSaving, setAdvSaving] = useState(false);

  // ── ADV: Auto-extract from image or text ──
  const [advExtractMode, setAdvExtractMode] = useState<"image" | "text">("image");
  const [advExtractText, setAdvExtractText] = useState("");
  const [advExtractFile, setAdvExtractFile] = useState<File | null>(null);
  const [advExtracting, setAdvExtracting] = useState(false);
  const [advExtracted, setAdvExtracted] = useState<any>(null);
  const [advExtractError, setAdvExtractError] = useState<string | null>(null);

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

  // ── Load Klaviyo campaigns: try cache first, then fetch fresh in background ──
  useEffect(() => {
    let cancelled = false;

    // 1) Try cache for instant render
    try {
      const cached = typeof window !== "undefined" ? localStorage.getItem(KLAVIYO_CACHE_KEY) : null;
      const cachedAt = typeof window !== "undefined" ? localStorage.getItem(KLAVIYO_CACHE_AT_KEY) : null;
      if (cached) {
        const arr = JSON.parse(cached);
        if (Array.isArray(arr) && arr.length > 0) {
          setLiveCampaigns(arr);
          setKlaviyoFetchedAt(cachedAt);
        }
      }
    } catch (e) { /* ignore cache errors */ }

    // 2) Always fetch fresh in background on mount (non-blocking)
    fetchKlaviyo().catch(() => { /* errors handled inside */ });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Klaviyo fetcher (manual button + auto on mount) ──
  const fetchKlaviyo = useCallback(async () => {
    setKlaviyoLoading(true);
    setKlaviyoError(null);
    try {
      const res = await fetch("/api/klaviyo?limit=75", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Klaviyo ${res.status}`);
      if (!Array.isArray(data.campaigns)) throw new Error("Risposta inattesa da Klaviyo");

      // Klaviyo returns most-recent first; reverse to oldest-first like CAMPAIGNS_FALLBACK
      const sorted = [...data.campaigns].sort((a, b) =>
        (a.date || "").localeCompare(b.date || "")
      );

      setLiveCampaigns(sorted);
      const now = data.fetchedAt || new Date().toISOString();
      setKlaviyoFetchedAt(now);

      // Persist to cache
      try {
        localStorage.setItem(KLAVIYO_CACHE_KEY, JSON.stringify(sorted));
        localStorage.setItem(KLAVIYO_CACHE_AT_KEY, now);
      } catch (e) { /* localStorage may be full; ignore */ }

    } catch (err: any) {
      console.error("[klaviyo] fetch failed:", err);
      setKlaviyoError(err.message || "Errore Klaviyo");
    } finally {
      setKlaviyoLoading(false);
    }
  }, []);

  // ── ADV: load weeks on tab open ──
  const fetchAdvWeeks = useCallback(async () => {
    setAdvLoading(true);
    setAdvError(null);
    try {
      const res = await fetch("/api/adv", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setAdvWeeks(data.weeks || []);
      // Auto-select latest week if nothing selected
      if (!advSelectedId && data.weeks && data.weeks.length > 0) {
        setAdvSelectedId(data.weeks[0].id);
      }
    } catch (err: any) {
      console.error("[adv] fetch failed:", err);
      setAdvError(err.message || "Errore caricamento settimane ADV");
    } finally {
      setAdvLoading(false);
    }
  }, [advSelectedId]);

  useEffect(() => {
    if (tab === "adv" && advWeeks === null && !advLoading) {
      fetchAdvWeeks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── ADV: save (create or update) ──
  const saveAdvWeek = useCallback(async () => {
    if (!advForm.week_number || !advForm.week_start || !advForm.week_end) {
      alert("Compila almeno: numero settimana, data inizio, data fine");
      return;
    }
    setAdvSaving(true);
    try {
      const body = {
        ...advForm,
        week_number: Number(advForm.week_number)
      };
      const url = advEditingId ? `/api/adv?id=${advEditingId}` : "/api/adv";
      const method = advEditingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // Refresh list
      await fetchAdvWeeks();
      setAdvShowForm(false);
      setAdvEditingId(null);
      setAdvForm(emptyAdvForm());
      setAdvSelectedId(data.week?.id || null);

      // Auto-trigger AI diagnosis on insert (only for new weeks, not edits)
      if (!advEditingId && data.week?.id) {
        diagnoseAdvWeek(data.week.id, "");
      }
    } catch (err: any) {
      alert("Errore salvataggio: " + (err.message || "sconosciuto"));
    } finally {
      setAdvSaving(false);
    }
  }, [advForm, advEditingId, fetchAdvWeeks]);

  // ── ADV: delete week ──
  const deleteAdvWeek = useCallback(async (id: string) => {
    if (!confirm("Eliminare questa settimana ADV? L'azione è irreversibile.")) return;
    try {
      const res = await fetch(`/api/adv?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (advSelectedId === id) setAdvSelectedId(null);
      await fetchAdvWeeks();
    } catch (err: any) {
      alert("Errore eliminazione: " + (err.message || "sconosciuto"));
    }
  }, [advSelectedId, fetchAdvWeeks]);

  // ── ADV: AI diagnosis ──
  const diagnoseAdvWeek = useCallback(async (weekId: string, focus: string) => {
    setAdvDiagnosing(true);
    try {
      const res = await fetch("/api/adv/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId, focus: focus || undefined, saveToDb: true })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await fetchAdvWeeks(); // reload to get the new ai_diagnosis on the week
    } catch (err: any) {
      alert("Errore diagnosi AI: " + (err.message || "sconosciuto"));
    } finally {
      setAdvDiagnosing(false);
    }
  }, [fetchAdvWeeks]);

  // ── ADV: enter edit mode ──
  const startAdvEdit = useCallback((week: any) => {
    setAdvEditingId(week.id);
    setAdvForm({
      week_number: String(week.week_number),
      week_label: week.week_label || "",
      week_start: week.week_start,
      week_end: week.week_end,
      notes: week.notes || "",
      acq_spesa: String(week.acq_spesa || ""),
      acq_impression: String(week.acq_impression || ""),
      acq_click: String(week.acq_click || ""),
      acq_acquisti: String(week.acq_acquisti || ""),
      acq_revenue: String(week.acq_revenue || ""),
      ret_spesa: String(week.ret_spesa || ""),
      ret_impression: String(week.ret_impression || ""),
      ret_click: String(week.ret_click || ""),
      ret_acquisti: String(week.ret_acquisti || ""),
      ret_revenue: String(week.ret_revenue || ""),
      tra_spesa: String(week.tra_spesa || ""),
      tra_impression: String(week.tra_impression || ""),
      tra_click: String(week.tra_click || "")
    });
    setAdvShowForm(true);
  }, []);

  // ── ADV: extract data from screenshot OR text via Claude vision ──
  const extractAdvData = useCallback(async () => {
    setAdvExtractError(null);
    setAdvExtracted(null);

    if (advExtractMode === "image" && !advExtractFile) {
      setAdvExtractError("Seleziona un'immagine prima");
      return;
    }
    if (advExtractMode === "text" && !advExtractText.trim()) {
      setAdvExtractError("Incolla il testo del report prima");
      return;
    }

    setAdvExtracting(true);
    try {
      let body: any;
      if (advExtractMode === "image" && advExtractFile) {
        // Convert file to base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const stripped = result.split(",")[1] || result;
            resolve(stripped);
          };
          reader.onerror = () => reject(new Error("Impossibile leggere il file"));
          reader.readAsDataURL(advExtractFile);
        });
        body = {
          imageBase64: base64,
          imageMediaType: advExtractFile.type || "image/png"
        };
      } else {
        body = { text: advExtractText };
      }

      const res = await fetch("/api/adv/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setAdvExtracted(data.extracted);
    } catch (err: any) {
      console.error("[adv/extract] failed:", err);
      setAdvExtractError(err.message || "Errore estrazione");
    } finally {
      setAdvExtracting(false);
    }
  }, [advExtractMode, advExtractFile, advExtractText]);

  // ── ADV: apply extracted data to form ──
  const applyExtractedToForm = useCallback(() => {
    if (!advExtracted) return;
    const e = advExtracted;
    setAdvForm({
      week_number: e.week_number != null ? String(e.week_number) : advForm.week_number,
      week_label: e.week_label || advForm.week_label,
      week_start: e.week_start || advForm.week_start,
      week_end: e.week_end || advForm.week_end,
      notes: e.notes || advForm.notes,
      acq_spesa: String(e.acq_spesa || 0),
      acq_impression: String(e.acq_impression || 0),
      acq_click: String(e.acq_click || 0),
      acq_acquisti: String(e.acq_acquisti || 0),
      acq_revenue: String(e.acq_revenue || 0),
      ret_spesa: String(e.ret_spesa || 0),
      ret_impression: String(e.ret_impression || 0),
      ret_click: String(e.ret_click || 0),
      ret_acquisti: String(e.ret_acquisti || 0),
      ret_revenue: String(e.ret_revenue || 0),
      tra_spesa: String(e.tra_spesa || 0),
      tra_impression: String(e.tra_impression || 0),
      tra_click: String(e.tra_click || 0)
    });
    // Reset extract panel
    setAdvExtracted(null);
    setAdvExtractFile(null);
    setAdvExtractText("");
  }, [advExtracted, advForm]);

  // Use live products if available, fallback to hardcoded
  const ACTIVE_PRODUCTS = liveProducts && liveProducts.length > 0 ? liveProducts : PRODUCTS;

  // Use live campaigns if available, fallback to hardcoded
  const CAMPAIGNS = liveCampaigns && liveCampaigns.length > 0 ? liveCampaigns : CAMPAIGNS_FALLBACK;
  const usingLiveCampaigns = !!(liveCampaigns && liveCampaigns.length > 0);

  // ── Computed (recalculates when CAMPAIGNS source changes) ──
  const last5 = CAMPAIGNS.slice(-5);
  const prev5 = CAMPAIGNS.slice(-10,-5);
  const avg = (arr, k) => arr.length ? arr.reduce((s,c)=>s+(c[k]||0),0)/arr.length : 0;
  const avgOr5 = avg(last5,"or"), avgCr5 = avg(last5,"cr"), avgRev5 = avg(last5,"rev");
  const pOr5 = avg(prev5,"or"), pCr5 = avg(prev5,"cr"), pRev5 = avg(prev5,"rev");
  const tOr = pOr5 ? ((avgOr5-pOr5)/pOr5)*100 : 0;
  const tCr = pCr5 ? ((avgCr5-pCr5)/pCr5)*100 : 0;
  const tRev = pRev5 ? ((avgRev5-pRev5)/pRev5)*100 : 0;
  const totalRev = CAMPAIGNS.reduce((s,c)=>s+(c.rev||0),0);
  const totalOrd = CAMPAIGNS.reduce((s,c)=>s+(c.orders||0),0);

  const months = useMemo(() => {
    const m = {};
    CAMPAIGNS.forEach(c => {
      if (!c.date) return;
      const k = c.date.slice(0,7);
      if (!m[k]) m[k] = {cps:[], rev:0, ord:0, orS:0, crS:0};
      m[k].cps.push(c); m[k].rev+=(c.rev||0); m[k].ord+=(c.orders||0); m[k].orS+=(c.or||0); m[k].crS+=(c.cr||0);
    });
    return Object.entries(m).sort(([a],[b])=>(a as string).localeCompare(b as string)).map(([k,v]:any)=>({
      key:k, label: ["","Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"][parseInt(k.slice(5,7))]+" "+k.slice(2,4),
      n:v.cps.length, rev:v.rev, ord:v.ord, avgOr:v.orS/v.cps.length, avgCr:v.crS/v.cps.length
    }));
  }, [CAMPAIGNS]);

  const typePerf = useMemo(() => {
    const tp = {};
    CAMPAIGNS.forEach(c => {
      const t = c.type || "brand";
      if(!tp[t]) tp[t]={n:0,rev:0,ord:0,crS:0};
      tp[t].n++; tp[t].rev+=(c.rev||0); tp[t].ord+=(c.orders||0); tp[t].crS+=(c.cr||0);
    });
    return Object.entries(tp).map(([k,v]:any)=>({type:k,...v,avgRev:v.rev/v.n,avgCr:v.crS/v.n})).sort((a,b)=>b.avgRev-a.avgRev);
  }, [CAMPAIGNS]);

  const suggestedType = useMemo(() => {
    const recent = CAMPAIGNS.slice(-3).map(c=>c.type);
    if(!recent.includes("multi")) return "multi";
    if(!recent.includes("categoria")) return "categoria";
    return "multi";
  }, [CAMPAIGNS]);

  const filtered = filterMonth==="all" ? CAMPAIGNS : CAMPAIGNS.filter(c=>c.date?.startsWith(filterMonth));

  // ── Product toggle ──
  const toggleProduct = (id) => {
    setConfig(p => ({...p, products: p.products.includes(id) ? p.products.filter(x=>x!==id) : [...p.products, id]}));
  };

  // ── GENERATE STRATEGY (Step 1 → 2) ──
  const generateStrategy = useCallback(async () => {
    setStep(1);
    const last8 = CAMPAIGNS.slice(-8);
    const bestCR = [...CAMPAIGNS].sort((a,b)=>(b.cr||0)-(a.cr||0)).slice(0,8);
    const bestRev = [...CAMPAIGNS].sort((a,b)=>(b.rev||0)-(a.rev||0)).slice(0,5);
    const selectedProds = config.products.map(id => ACTIVE_PRODUCTS.find(p=>p.id===id)).filter(Boolean);

    const typeLabel = TYPE_LABELS[config.type] || config.type;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "strategy",
          emailType: typeLabel,
          selectedProducts: selectedProds,
          recentCampaigns: last8.map(c => ({
            name: c.subject || "",
            subject: c.subject || "",
            sendDate: c.date || "",
            weekday: c.date ? new Date(c.date).toLocaleDateString("en-US", { weekday: "long" }) : "",
            recipients: c.recipients || 0,
            opens: c.opens || 0,
            openRate: c.or || 0,
            clicks: c.clicks || 0,
            clickRate: c.cr || 0,
            orders: c.orders || 0,
            revenue: c.rev || 0,
            unsubscribes: c.unsub || 0
          })),
          topPerformers: bestRev.map(c => ({
            name: c.subject || "",
            subject: c.subject || "",
            sendDate: c.date || "",
            weekday: "",
            recipients: 0,
            opens: 0,
            openRate: c.or || 0,
            clicks: 0,
            clickRate: c.cr || 0,
            orders: c.orders || 0,
            revenue: c.rev || 0,
            unsubscribes: c.unsub || 0
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
  }, [config, CAMPAIGNS, ACTIVE_PRODUCTS]);

  // ── GENERATE HTML (Step 2 → 3) ──
  const generateHtml = useCallback(async (overrideIndex?: number) => {
    const idx = typeof overrideIndex === "number" ? overrideIndex : selectedSubject;
    if (idx === null || idx === undefined || !result) return;
    if (!result.subjects || !result.subjects[idx]) return;

    if (idx !== selectedSubject) setSelectedSubject(idx);
    setHtmlStep(1);

    const subj = result.subjects[idx];
    const selectedProds = config.products.map(id => ACTIVE_PRODUCTS.find(p=>p.id===id)).filter(Boolean);
    const prodsToUse = selectedProds.length > 0 ? selectedProds : ACTIVE_PRODUCTS.slice(0,6);

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
          templateStyle: config.templateStyle || "classico",
          colorMode: config.colorMode || "light",
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
    input: { width:"100%", padding:"8px 10px", fontSize:"12px", border:"1px solid #e8ddd0", borderRadius:"6px", background:"#ffffff", color:"#1a1a1a", outline:"none", fontFamily:"inherit", boxSizing:"border-box" as const },
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
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            {/* Aggiorna campagne button */}
            <button
              onClick={fetchKlaviyo}
              disabled={klaviyoLoading}
              title={klaviyoFetchedAt ? `Aggiornato ${formatAgo(klaviyoFetchedAt)}` : "Aggiorna campagne da Klaviyo"}
              style={{
                display:"flex", alignItems:"center", gap:"5px",
                padding:"6px 10px", borderRadius:"6px",
                background: klaviyoLoading ? "#f5f1ea" : (klaviyoError ? "#d645450a" : "#ffffff"),
                border:`1px solid ${klaviyoError ? "#d6454544" : "#e8ddd0"}`,
                color: klaviyoError ? "#d64545" : "#5a5a5a",
                fontSize:"10px", fontWeight:600, cursor: klaviyoLoading ? "wait" : "pointer",
                fontFamily:"inherit", letterSpacing:"0.3px",
                transition:"all 0.15s"
              }}
            >
              <span style={{ display:"inline-flex", animation: klaviyoLoading ? "spin 1s linear infinite" : "none" }}>{I.refresh}</span>
              {klaviyoLoading ? "Aggiornamento..." : (klaviyoError ? "Riprova" : "Aggiorna")}
            </button>
            <div style={{ fontSize:"9px", color:"#5a5a5a", padding:"4px 10px", border:"1px solid #e8ddd0", borderRadius:"5px" }}>
              {CAMPAIGNS.length} campagne{usingLiveCampaigns ? " live" : ""} · {ACTIVE_PRODUCTS.length} prodotti{liveProducts ? " live" : ""}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", maxWidth:"1100px", margin:"0 auto" }}>
          <button style={S.tab(tab==="dashboard")} onClick={()=>setTab("dashboard")}>{I.dash} Dashboard</button>
          <button style={S.tab(tab==="generator")} onClick={()=>{setTab("generator");setStep(0);setResult(null);setHtmlStep(0);setHtmlOutput("");setSelectedSubject(null);}}>{I.spark} Generatore</button>
          <button style={S.tab(tab==="campaigns")} onClick={()=>setTab("campaigns")}>{I.list} Campagne</button>
          <button style={S.tab(tab==="adv")} onClick={()=>setTab("adv")}>📊 ADV</button>
          <button style={S.tab(tab==="cover")} onClick={()=>setTab("cover")}>🖼️ Cover</button>
        </div>
      </div>

      {/* Klaviyo error banner (subtle, non-blocking) */}
      {klaviyoError && (
        <div style={{ maxWidth:"1100px", margin:"10px auto 0", padding:"0 20px" }}>
          <div style={{ background:"#d645450a", border:"1px solid #d6454522", borderRadius:"7px", padding:"8px 14px", display:"flex", alignItems:"center", gap:"8px", fontSize:"11px" }}>
            <span style={{ color:"#d64545" }}>{I.alert}</span>
            <span style={{ color:"#5a5a5a", flex:1 }}>
              Klaviyo non risponde. Mostro {usingLiveCampaigns ? "ultima cache disponibile" : "dati storici di backup"}.
              <span style={{ color:"#9a9089", marginLeft:"6px" }}>({klaviyoError})</span>
            </span>
          </div>
        </div>
      )}

      <div style={{ padding:"18px 20px", maxWidth:"1100px", margin:"0 auto" }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab==="dashboard" && (<div>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"14px" }}>
            <Kpi label="Open Rate" value={`${fmtPct(avgOr5)}%`} trend={tOr} color="#1a9d94" sub="media ultime 5" spark={<Spark data={CAMPAIGNS.slice(-12).map(c=>c.or||0)} color="#1a9d94"/>}/>
            <Kpi label="Click Rate" value={`${fmtPct(avgCr5)}%`} trend={tCr} color={avgCr5<1?"#d64545":"#b8924a"} sub="media ultime 5" spark={<Spark data={CAMPAIGNS.slice(-12).map(c=>c.cr||0)} color={avgCr5<1?"#d64545":"#b8924a"}/>}/>
            <Kpi label="Rev medio" value={`€${Math.round(avgRev5)}`} trend={tRev} color="#b8924a" sub="media ultime 5" spark={<Spark data={CAMPAIGNS.slice(-12).map(c=>c.rev||0)} color="#b8924a"/>}/>
            <Kpi label="Totale" value={`€${(totalRev/1000).toFixed(1)}k`} color="#7c5cd4" sub={`${totalOrd} ordini`}/>
          </div>

          {avgCr5 > 0 && avgCr5 < 1.2 && (
            <div style={{ background:"#d645450a", border:"1px solid #d6454522", borderRadius:"8px", padding:"12px 16px", marginBottom:"14px", display:"flex", gap:"10px" }}>
              <span style={{ color:"#d64545", marginTop:"1px" }}>{I.alert}</span>
              <div style={{ fontSize:"12px", color:"#5a5a5a", lineHeight:1.5 }}>
                <b style={{color:"#d64545"}}>CR in calo critico: {fmtPct(avgCr5)}%</b> — Le multi-prodotto hanno CR storica più alta. Servono più prodotti cliccabili e subject con hook.
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
            <div style={S.sec}>
              <div style={S.secTitle}>Revenue mensile</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height:"120px" }}>
                {months.map((m,i) => {
                  const mx = Math.max(...months.map(x=>x.rev), 1)*1.1;
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
                    <span style={{ width:"60px", fontSize:"9px", color:TYPE_COLORS[t.type]||"#5a5a5a", fontWeight:700, textTransform:"uppercase" }}>{TYPE_LABELS[t.type]?.slice(0,8) || t.type}</span>
                    <div style={{ flex:1, height:"16px", background:"#e8ddd0", borderRadius:"3px", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min((t.avgRev/400)*100, 100)}%`, background:TYPE_COLORS[t.type]||"#b8924a", borderRadius:"3px" }}/>
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
                <span style={{ color:"#7a7a7a", fontFamily:"'Space Mono',monospace", fontSize:"10px" }}>{c.date?.slice(5) || "—"}</span>
                <div style={{ display:"flex", alignItems:"center", gap:"6px", overflow:"hidden" }}>
                  <span style={{ fontSize:"7px", padding:"2px 5px", borderRadius:"3px", background:(TYPE_COLORS[c.type]||"#b8924a")+"1a", color:TYPE_COLORS[c.type]||"#b8924a", fontWeight:700 }}>{TYPE_LABELS[c.type]?.slice(0,5) || c.type?.slice(0,5)}</span>
                  <span style={{ color:"#3a3a3a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.subject}</span>
                </div>
                <span style={{ textAlign:"right", color:c.or>=68?"#1a9d94":"#5a5a5a", fontFamily:"'Space Mono',monospace" }}>{fmtPct(c.or)}%</span>
                <span style={{ textAlign:"right", color:c.cr>=1.5?"#1a9d94":c.cr<1?"#d64545":"#5a5a5a", fontFamily:"'Space Mono',monospace" }}>{fmtPct(c.cr)}%</span>
                <span style={{ textAlign:"right", color:"#b8924a", fontWeight:700, fontFamily:"'Space Mono',monospace" }}>€{Math.round(c.rev||0)}</span>
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
              <div style={S.secTitle}>Contesto — ultime 4 email{usingLiveCampaigns ? " (live)" : ""}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"8px" }}>
                {CAMPAIGNS.slice(-4).map((c,i) => (
                  <div key={i} style={{ padding:"10px", borderRadius:"7px", background:"#f5f1ea", border:"1px solid #e8ddd0" }}>
                    <div style={{ fontSize:"9px", color:"#7a7a7a", marginBottom:"3px" }}>{c.date?.slice(5)} · {TYPE_LABELS[c.type] || c.type}</div>
                    <div style={{ fontSize:"11px", color:"#2a2a2a", fontWeight:600, marginBottom:"4px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>"{c.subject}"</div>
                    <div style={{ display:"flex", gap:"8px", fontSize:"10px" }}>
                      <span style={{ color:c.cr>=1.2?"#1a9d94":"#d64545" }}>CR {fmtPct(c.cr)}%</span>
                      <span style={{ color:"#b8924a" }}>€{Math.round(c.rev||0)}</span>
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
                  Consiglio <b style={{color:"#1a1a1a"}}>{TYPE_LABELS[suggestedType] || suggestedType}</b> (rev medio €{Math.round(typePerf.find(t=>t.type===suggestedType)?.avgRev||0)}).
                  {avgCr5>0 && avgCr5<1.2 && " CR in calo: più prodotti cliccabili."}
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

              {/* Template Style */}
              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontSize:"10px", color:"#7a7a7a", display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"1px" }}>Stile grafico</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"6px" }}>
                  {TEMPLATE_OPTIONS.map(t => {
                    const sel = config.templateStyle === t.id;
                    return (
                      <button key={t.id} onClick={()=>setConfig(p=>({...p,templateStyle:t.id}))} style={{
                        padding:"10px 12px", borderRadius:"7px", textAlign:"left",
                        background: sel ? "#b8924a10" : "#f5f1ea",
                        border: `1px solid ${sel ? "#b8924a55" : "#e8ddd0"}`,
                        color: sel ? "#1a1a1a" : "#5a5a5a",
                        cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s"
                      }}>
                        <div style={{ fontSize:"12px", fontWeight:700, color:sel?"#b8924a":"#1a1a1a", marginBottom:"3px", textTransform:"uppercase", letterSpacing:"1px" }}>{t.label}</div>
                        <div style={{ fontSize:"10px", color:"#7a7a7a", lineHeight:1.4 }}>{t.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Mode */}
              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontSize:"10px", color:"#7a7a7a", display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"1px" }}>Tema colori</label>
                <div style={{ display:"flex", gap:"6px" }}>
                  {COLOR_MODES.map(m => {
                    const sel = config.colorMode === m.id;
                    return (
                      <button key={m.id} onClick={()=>setConfig(p=>({...p,colorMode:m.id}))} style={{
                        flex:1, padding:"12px 14px", borderRadius:"7px", textAlign:"left",
                        background: sel ? m.bg : "#f5f1ea",
                        border: `1.5px solid ${sel ? "#b8924a" : "#e8ddd0"}`,
                        color: sel ? m.text : "#5a5a5a",
                        cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
                        display:"flex", alignItems:"center", gap:"10px"
                      }}>
                        <div style={{ display:"flex", gap:"3px" }}>
                          <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:m.bg, border:`1px solid ${sel?m.text:"#e8ddd0"}` }}/>
                          <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:m.text, border:"1px solid #e8ddd0" }}/>
                          <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:m.accent, border:"1px solid #e8ddd0" }}/>
                        </div>
                        <div>
                          <div style={{ fontSize:"12px", fontWeight:700, textTransform:"uppercase", letterSpacing:"1px" }}>{m.label}</div>
                          <div style={{ fontSize:"9px", opacity:0.7 }}>bg {m.bg} · accent {m.accent}</div>
                        </div>
                      </button>
                    );
                  })}
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
                      const p = ACTIVE_PRODUCTS.find(x=>x.id===id);
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
                <span style={{ color:"#7a7a7a", fontFamily:"'Space Mono',monospace", fontSize:"10px" }}>{c.date?.slice(5) || "—"}</span>
                <div style={{ display:"flex", alignItems:"center", gap:"5px", overflow:"hidden" }}>
                  <span style={{ fontSize:"7px", padding:"1px 4px", borderRadius:"2px", background:(TYPE_COLORS[c.type]||"#b8924a")+"15", color:TYPE_COLORS[c.type]||"#b8924a", fontWeight:700, whiteSpace:"nowrap" }}>{TYPE_LABELS[c.type]?.slice(0,5) || c.type?.slice(0,5)}</span>
                  <span style={{ color:"#3a3a3a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.subject}</span>
                  {c.html && <span style={{ fontSize:"6px", padding:"1px 3px", borderRadius:"2px", background:"#b8924a22", color:"#b8924a", fontWeight:700 }}>HTML</span>}
                </div>
                <span style={{ textAlign:"right", color:c.or>=70?"#1a9d94":"#6a6a6a", fontFamily:"'Space Mono',monospace" }}>{fmtPct(c.or)}%</span>
                <span style={{ textAlign:"right", color:c.cr>=1.5?"#1a9d94":c.cr<1?"#d64545":"#6a6a6a", fontFamily:"'Space Mono',monospace" }}>{fmtPct(c.cr)}%</span>
                <span style={{ textAlign:"right", color:c.orders>=7?"#1a9d94":"#6a6a6a", fontFamily:"'Space Mono',monospace" }}>{c.orders||0}</span>
                <span style={{ textAlign:"right", color:"#b8924a", fontWeight:700, fontFamily:"'Space Mono',monospace" }}>€{Math.round(c.rev||0)}</span>
                <span style={{ textAlign:"right", color:c.unsub>15?"#d64545":"#c4b8a8", fontSize:"10px" }}>{c.unsub||0}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop:"10px", padding:"10px 14px", background:"#faf7f2", borderRadius:"7px", display:"flex", gap:"16px", fontSize:"11px", color:"#9a9089", flexWrap:"wrap" }}>
            <span>{filtered.length} email</span>
            <span>OR: <b style={{color:"#1a1a1a"}}>{fmtPct(avg(filtered,"or"))}%</b></span>
            <span>CR: <b style={{color:"#1a1a1a"}}>{fmtPct(avg(filtered,"cr"))}%</b></span>
            <span>Rev: <b style={{color:"#b8924a"}}>€{Math.round(filtered.reduce((s,c)=>s+(c.rev||0),0))}</b></span>
            <span>Ordini: <b style={{color:"#1a1a1a"}}>{filtered.reduce((s,c)=>s+(c.orders||0),0)}</b></span>
          </div>
        </div>)}

        {/* ═══ ADV (META ADS WEEKLY REPORTS) ═══ */}
        {tab==="adv" && (<div>
          {advLoading && (advWeeks === null) && (
            <div style={{ padding:"40px", textAlign:"center", color:"#9a9089" }}>
              <div style={{ display:"inline-block", width:"24px", height:"24px", border:"3px solid #e8ddd0", borderTopColor:"#b8924a", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
              <div style={{ marginTop:"12px", fontSize:"12px" }}>Caricamento settimane ADV...</div>
            </div>
          )}

          {advError && (
            <div style={{ padding:"14px 18px", background:"#fdf2f2", border:"1px solid #d6454520", borderRadius:"7px", marginBottom:"14px", fontSize:"12px", color:"#d64545" }}>
              ⚠️ {advError}
              <button onClick={fetchAdvWeeks} style={{ ...S.btn(false), marginLeft:"10px", fontSize:"11px" }}>Riprova</button>
            </div>
          )}

          {/* HEADER */}
          {advWeeks !== null && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
              <div>
                <div style={{ fontSize:"18px", fontWeight:700, color:"#1a1a1a" }}>Performance ADV settimanale</div>
                <div style={{ fontSize:"11px", color:"#9a9089", marginTop:"2px" }}>
                  {advWeeks.length} settiman{advWeeks.length === 1 ? "a" : "e"} salvat{advWeeks.length === 1 ? "a" : "e"}
                  {advLoading && " · aggiornamento..."}
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={fetchAdvWeeks} disabled={advLoading} style={{ ...S.btn(false), fontSize:"12px" }}>↻ Aggiorna</button>
                <button
                  onClick={() => { setAdvForm(emptyAdvForm()); setAdvEditingId(null); setAdvShowForm(true); }}
                  style={{ ...S.btn(true), fontSize:"12px" }}
                >+ Nuova settimana</button>
              </div>
            </div>
          )}

          {/* FORM (add/edit) */}
          {advShowForm && (
            <div style={{ marginBottom:"20px", padding:"20px", background:"#ffffff", border:"1px solid #e8ddd0", borderRadius:"10px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
                <div style={{ fontSize:"14px", fontWeight:700, color:"#1a1a1a" }}>
                  {advEditingId ? "Modifica settimana" : "Nuova settimana ADV"}
                </div>
                <button onClick={() => { setAdvShowForm(false); setAdvEditingId(null); setAdvForm(emptyAdvForm()); setAdvExtracted(null); setAdvExtractFile(null); setAdvExtractText(""); setAdvExtractError(null); }} style={{ ...S.btn(false), fontSize:"11px" }}>✕ Annulla</button>
              </div>

              {/* ── AUTO-FILL panel (only when creating new, not editing) ── */}
              {!advEditingId && (
                <div style={{ marginBottom:"16px", padding:"14px", background:"linear-gradient(135deg, #faf7f2 0%, #f5ede0 100%)", border:"1px dashed #b8924a55", borderRadius:"8px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px", flexWrap:"wrap", gap:"6px" }}>
                    <div style={{ fontSize:"12px", fontWeight:700, color:"#1a1a1a" }}>
                      🤖 Auto-fill con AI <span style={{ fontWeight:400, color:"#7a7a7a", fontSize:"11px" }}>— evita di scrivere a mano</span>
                    </div>
                    <div style={{ display:"flex", gap:"4px" }}>
                      <button onClick={()=>{setAdvExtractMode("image"); setAdvExtracted(null); setAdvExtractError(null);}} style={{ padding:"5px 11px", fontSize:"11px", borderRadius:"5px", border:"1px solid #e8ddd0", background: advExtractMode==="image" ? "#b8924a" : "#ffffff", color: advExtractMode==="image" ? "#ffffff" : "#3a3a3a", cursor:"pointer", fontWeight: advExtractMode==="image" ? 600 : 400 }}>📸 Screenshot</button>
                      <button onClick={()=>{setAdvExtractMode("text"); setAdvExtracted(null); setAdvExtractError(null);}} style={{ padding:"5px 11px", fontSize:"11px", borderRadius:"5px", border:"1px solid #e8ddd0", background: advExtractMode==="text" ? "#b8924a" : "#ffffff", color: advExtractMode==="text" ? "#ffffff" : "#3a3a3a", cursor:"pointer", fontWeight: advExtractMode==="text" ? 600 : 400 }}>📝 Testo</button>
                    </div>
                  </div>

                  {advExtractMode === "image" && (
                    <div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={e => setAdvExtractFile(e.target.files?.[0] || null)}
                        style={{ display:"block", marginBottom:"8px", fontSize:"11px", color:"#3a3a3a" }}
                      />
                      {advExtractFile && (
                        <div style={{ fontSize:"10px", color:"#7a7a7a", marginBottom:"8px" }}>
                          ✓ {advExtractFile.name} · {(advExtractFile.size/1024).toFixed(0)} KB
                        </div>
                      )}
                    </div>
                  )}

                  {advExtractMode === "text" && (
                    <textarea
                      value={advExtractText}
                      onChange={e => setAdvExtractText(e.target.value)}
                      placeholder="Incolla qui il messaggio dei ragazzi delle ads. Esempio:&#10;&#10;ACQUISIZIONE ultimi 7gg&#10;Importo Speso: €969,01&#10;Acquisti: 59&#10;CPA: €16,42&#10;ROAS: 2,61&#10;&#10;RETARGETING&#10;Importo Speso: €106,68&#10;..."
                      style={{ ...S.input, width:"100%", minHeight:"110px", resize:"vertical", fontFamily:"'Space Mono', monospace", fontSize:"11px" }}
                    />
                  )}

                  <div style={{ display:"flex", gap:"8px", alignItems:"center", marginTop:"8px" }}>
                    <button
                      onClick={extractAdvData}
                      disabled={advExtracting || (advExtractMode==="image" && !advExtractFile) || (advExtractMode==="text" && !advExtractText.trim())}
                      style={{
                        padding:"8px 16px", fontSize:"12px", fontWeight:600,
                        borderRadius:"6px", border:"none",
                        background:"linear-gradient(135deg,#b8924a,#8a6630)",
                        color:"#ffffff", cursor: advExtracting ? "wait" : "pointer",
                        opacity: (advExtracting || (advExtractMode==="image" && !advExtractFile) || (advExtractMode==="text" && !advExtractText.trim())) ? 0.5 : 1
                      }}
                    >
                      {advExtracting ? "Analizzando..." : "✨ Estrai dati"}
                    </button>
                    {advExtractError && <span style={{ fontSize:"11px", color:"#d64545" }}>⚠️ {advExtractError}</span>}
                  </div>

                  {/* PREVIEW of extracted data */}
                  {advExtracted && (
                    <div style={{ marginTop:"12px", padding:"12px 14px", background:"#ffffff", border:"1px solid #b8924a55", borderRadius:"7px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                        <div style={{ fontSize:"11px", fontWeight:700, color:"#1a1a1a" }}>
                          Anteprima dati estratti
                          {advExtracted.confidence && (
                            <span style={{
                              marginLeft:"8px", fontSize:"9px", padding:"2px 6px", borderRadius:"3px",
                              background: advExtracted.confidence === "high" ? "#1a9d9420" : advExtracted.confidence === "medium" ? "#b8924a20" : "#d6454520",
                              color: advExtracted.confidence === "high" ? "#1a9d94" : advExtracted.confidence === "medium" ? "#b8924a" : "#d64545",
                              fontWeight:700
                            }}>{advExtracted.confidence.toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"8px", fontSize:"11px" }}>
                        <PreviewBlock title="🎯 Acquisizione" data={[
                          ["Spesa", advExtracted.acq_spesa && fmtEuro(advExtracted.acq_spesa)],
                          ["Acquisti", advExtracted.acq_acquisti],
                          ["Revenue", advExtracted.acq_revenue && fmtEuro(advExtracted.acq_revenue)],
                          ["Impression", advExtracted.acq_impression || null],
                          ["Click", advExtracted.acq_click || null],
                        ]} />
                        <PreviewBlock title="🔄 Retargeting" data={[
                          ["Spesa", advExtracted.ret_spesa && fmtEuro(advExtracted.ret_spesa)],
                          ["Acquisti", advExtracted.ret_acquisti],
                          ["Revenue", advExtracted.ret_revenue && fmtEuro(advExtracted.ret_revenue)],
                          ["Impression", advExtracted.ret_impression || null],
                          ["Click", advExtracted.ret_click || null],
                        ]} />
                        <PreviewBlock title="🚀 Traffico" data={[
                          ["Spesa", advExtracted.tra_spesa && fmtEuro(advExtracted.tra_spesa)],
                          ["Click", advExtracted.tra_click],
                          ["Impression", advExtracted.tra_impression || null],
                        ]} />
                      </div>

                      {(advExtracted.week_number || advExtracted.week_label || advExtracted.week_start || advExtracted.notes) && (
                        <div style={{ marginTop:"8px", padding:"7px 10px", background:"#faf7f2", borderRadius:"5px", fontSize:"10px", color:"#5a5a5a" }}>
                          {advExtracted.week_number && <span>Settimana #{advExtracted.week_number}</span>}
                          {advExtracted.week_label && <span> · {advExtracted.week_label}</span>}
                          {(advExtracted.week_start || advExtracted.week_end) && <span> · {advExtracted.week_start || "?"} → {advExtracted.week_end || "?"}</span>}
                          {advExtracted.notes && <div style={{ marginTop:"3px", fontStyle:"italic" }}>Note: {advExtracted.notes}</div>}
                        </div>
                      )}

                      {advExtracted.warnings && advExtracted.warnings.length > 0 && (
                        <div style={{ marginTop:"8px", padding:"7px 10px", background:"#fdf2f2", borderRadius:"5px", fontSize:"10px", color:"#d64545" }}>
                          <b>Avvisi:</b>
                          <ul style={{ margin:"3px 0 0 16px", padding:0 }}>
                            {advExtracted.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      )}

                      <div style={{ display:"flex", gap:"6px", marginTop:"10px" }}>
                        <button onClick={applyExtractedToForm} style={{ ...S.btn(true), fontSize:"11px" }}>✓ Accetta e compila form</button>
                        <button onClick={()=>setAdvExtracted(null)} style={{ ...S.btn(false), fontSize:"11px" }}>↻ Riprova</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Metadati */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"10px", marginBottom:"14px" }}>
                <div>
                  <label style={{ fontSize:"10px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"4px" }}>Numero settimana *</label>
                  <input type="number" value={advForm.week_number} onChange={e=>setAdvForm({...advForm, week_number:e.target.value})} placeholder="es. 6" style={S.input} />
                </div>
                <div>
                  <label style={{ fontSize:"10px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"4px" }}>Etichetta (opz.)</label>
                  <input type="text" value={advForm.week_label} onChange={e=>setAdvForm({...advForm, week_label:e.target.value})} placeholder="es. Saldi giugno" style={S.input} />
                </div>
                <div>
                  <label style={{ fontSize:"10px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"4px" }}>Data inizio *</label>
                  <input type="date" value={advForm.week_start} onChange={e=>setAdvForm({...advForm, week_start:e.target.value})} style={S.input} />
                </div>
                <div>
                  <label style={{ fontSize:"10px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"4px" }}>Data fine *</label>
                  <input type="date" value={advForm.week_end} onChange={e=>setAdvForm({...advForm, week_end:e.target.value})} style={S.input} />
                </div>
              </div>

              {/* Acquisizione */}
              <div style={{ marginBottom:"14px" }}>
                <div style={{ fontSize:"11px", fontWeight:700, color:"#1a1a1a", marginBottom:"8px", letterSpacing:"1px" }}>🎯 ACQUISIZIONE</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:"8px" }}>
                  <NumField label="Spesa €" value={advForm.acq_spesa} onChange={v=>setAdvForm({...advForm, acq_spesa:v})} />
                  <NumField label="Impression" value={advForm.acq_impression} onChange={v=>setAdvForm({...advForm, acq_impression:v})} />
                  <NumField label="Click" value={advForm.acq_click} onChange={v=>setAdvForm({...advForm, acq_click:v})} />
                  <NumField label="Acquisti" value={advForm.acq_acquisti} onChange={v=>setAdvForm({...advForm, acq_acquisti:v})} />
                  <NumField label="Revenue €" value={advForm.acq_revenue} onChange={v=>setAdvForm({...advForm, acq_revenue:v})} />
                </div>
              </div>

              {/* Retargeting */}
              <div style={{ marginBottom:"14px" }}>
                <div style={{ fontSize:"11px", fontWeight:700, color:"#1a1a1a", marginBottom:"8px", letterSpacing:"1px" }}>🔄 RETARGETING</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:"8px" }}>
                  <NumField label="Spesa €" value={advForm.ret_spesa} onChange={v=>setAdvForm({...advForm, ret_spesa:v})} />
                  <NumField label="Impression" value={advForm.ret_impression} onChange={v=>setAdvForm({...advForm, ret_impression:v})} />
                  <NumField label="Click" value={advForm.ret_click} onChange={v=>setAdvForm({...advForm, ret_click:v})} />
                  <NumField label="Acquisti" value={advForm.ret_acquisti} onChange={v=>setAdvForm({...advForm, ret_acquisti:v})} />
                  <NumField label="Revenue €" value={advForm.ret_revenue} onChange={v=>setAdvForm({...advForm, ret_revenue:v})} />
                </div>
              </div>

              {/* Traffico */}
              <div style={{ marginBottom:"14px" }}>
                <div style={{ fontSize:"11px", fontWeight:700, color:"#1a1a1a", marginBottom:"8px", letterSpacing:"1px" }}>🚀 TRAFFICO</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"8px" }}>
                  <NumField label="Spesa €" value={advForm.tra_spesa} onChange={v=>setAdvForm({...advForm, tra_spesa:v})} />
                  <NumField label="Impression" value={advForm.tra_impression} onChange={v=>setAdvForm({...advForm, tra_impression:v})} />
                  <NumField label="Click" value={advForm.tra_click} onChange={v=>setAdvForm({...advForm, tra_click:v})} />
                </div>
              </div>

              {/* Note */}
              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontSize:"10px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"4px" }}>Note (opz.)</label>
                <textarea value={advForm.notes} onChange={e=>setAdvForm({...advForm, notes:e.target.value})} placeholder="es. Nuova creatività lanciata mercoledì, weekend di sconti..." style={{ ...S.input, width:"100%", minHeight:"56px", resize:"vertical" }} />
              </div>

              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={saveAdvWeek} disabled={advSaving} style={{ ...S.btn(true), opacity: advSaving ? 0.6 : 1 }}>
                  {advSaving ? "Salvando..." : (advEditingId ? "✓ Salva modifiche" : "✓ Salva e genera diagnosi AI")}
                </button>
                {!advEditingId && (
                  <div style={{ fontSize:"10px", color:"#9a9089", alignSelf:"center" }}>
                    Claude analizzerà automaticamente i dati al salvataggio
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONTENT: lista vuota OR weeks list + detail */}
          {advWeeks !== null && advWeeks.length === 0 && !advShowForm && (
            <div style={{ padding:"60px 24px", textAlign:"center", background:"#faf7f2", borderRadius:"10px", color:"#9a9089" }}>
              <div style={{ fontSize:"42px", marginBottom:"10px" }}>📊</div>
              <div style={{ fontSize:"15px", color:"#1a1a1a", fontWeight:600, marginBottom:"6px" }}>Nessuna settimana ADV salvata</div>
              <div style={{ fontSize:"12px", marginBottom:"16px" }}>Inizia caricando il primo report settimanale dei ragazzi che gestiscono le ads.</div>
              <button onClick={() => { setAdvForm(emptyAdvForm()); setAdvEditingId(null); setAdvShowForm(true); }} style={{ ...S.btn(true) }}>+ Carica prima settimana</button>
            </div>
          )}

          {advWeeks !== null && advWeeks.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:"16px" }}>
              {/* SIDEBAR weeks list */}
              <div style={{ background:"#ffffff", border:"1px solid #e8ddd0", borderRadius:"10px", overflow:"hidden" }}>
                <div style={{ padding:"12px 14px", borderBottom:"1px solid #e8ddd0", fontSize:"10px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px", fontWeight:700 }}>
                  Settimane ({advWeeks.length})
                </div>
                <div style={{ maxHeight:"640px", overflowY:"auto" }}>
                  {advWeeks.map((w: any) => {
                    const k = deriveAdvKPIs(w);
                    const isSelected = w.id === advSelectedId;
                    return (
                      <div
                        key={w.id}
                        onClick={() => setAdvSelectedId(w.id)}
                        style={{
                          padding:"12px 14px",
                          cursor:"pointer",
                          borderBottom:"1px solid #f5f0ea",
                          background: isSelected ? "#faf7f2" : "transparent",
                          borderLeft: isSelected ? "3px solid #b8924a" : "3px solid transparent",
                          transition:"all 0.1s"
                        }}
                        onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background="#fafafa"; }}
                        onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background="transparent"; }}
                      >
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"4px" }}>
                          <div style={{ fontSize:"13px", fontWeight:700, color:"#1a1a1a" }}>W{w.week_number}</div>
                          <div style={{ fontSize:"9px", color:"#9a9089", fontFamily:"'Space Mono', monospace" }}>{w.week_start?.slice(5)} → {w.week_end?.slice(5)}</div>
                        </div>
                        {w.week_label && <div style={{ fontSize:"10px", color:"#7a7a7a", marginBottom:"6px", fontStyle:"italic" }}>{w.week_label}</div>}
                        <div style={{ display:"flex", gap:"8px", fontSize:"10px", color:"#5a5a5a" }}>
                          <span>Sp: <b style={{color:"#1a1a1a"}}>{fmtEuro(k?.total_spesa || 0)}</b></span>
                          <span>ROAS: <b style={{color: (k?.total_roas || 0) >= 3 ? "#1a9d94" : (k?.total_roas || 0) >= 2 ? "#b8924a" : "#d64545"}}>{(k?.total_roas || 0).toFixed(2)}x</b></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MAIN PANEL: detail of selected week */}
              <div>
                {(() => {
                  const w = advWeeks.find((x: any) => x.id === advSelectedId);
                  if (!w) return <div style={{ padding:"40px", textAlign:"center", color:"#9a9089", fontSize:"13px" }}>Seleziona una settimana</div>;
                  const idx = advWeeks.findIndex((x: any) => x.id === w.id);
                  // remember advWeeks is sorted DESC by week_number, so prev is at idx+1
                  const prev = idx + 1 < advWeeks.length ? advWeeks[idx + 1] : null;
                  const k = deriveAdvKPIs(w);
                  const kPrev = prev ? deriveAdvKPIs(prev) : null;

                  return (
                    <div>
                      {/* Sub-tabs */}
                      <div style={{ display:"flex", gap:"4px", marginBottom:"14px", borderBottom:"1px solid #e8ddd0" }}>
                        {[
                          {id:"week", label:"📅 Settimana", show:true},
                          {id:"compare", label:"⚖️ Confronto", show:advWeeks.length > 1},
                          {id:"trend", label:"📈 Trend", show:advWeeks.length >= 2},
                          {id:"diagnosi", label:"🔍 Diagnosi AI", show:true},
                          {id:"teoria", label:"📚 Teoria", show:true},
                        ].filter(s => s.show).map(s => (
                          <button
                            key={s.id}
                            onClick={() => setAdvSubTab(s.id as any)}
                            style={{
                              padding:"8px 14px",
                              background:"transparent",
                              border:"none",
                              borderBottom: advSubTab === s.id ? "2px solid #b8924a" : "2px solid transparent",
                              color: advSubTab === s.id ? "#1a1a1a" : "#7a7a7a",
                              fontWeight: advSubTab === s.id ? 600 : 400,
                              cursor:"pointer",
                              fontSize:"12px",
                              transition:"all 0.1s"
                            }}
                          >{s.label}</button>
                        ))}
                      </div>

                      {/* WEEK DETAIL */}
                      {advSubTab === "week" && (
                        <div>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
                            <div>
                              <div style={{ fontSize:"22px", fontWeight:700, color:"#1a1a1a" }}>
                                Settimana {w.week_number}{w.week_label && <span style={{ fontWeight:400, color:"#7a7a7a", marginLeft:"10px", fontSize:"14px" }}>· {w.week_label}</span>}
                              </div>
                              <div style={{ fontSize:"11px", color:"#9a9089", marginTop:"4px", fontFamily:"'Space Mono', monospace" }}>
                                {w.week_start} → {w.week_end}{prev && ` · confronto con W${prev.week_number}`}
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:"6px" }}>
                              <button onClick={() => startAdvEdit(w)} style={{ ...S.btn(false), fontSize:"11px" }}>✎ Modifica</button>
                              <button onClick={() => deleteAdvWeek(w.id)} style={{ ...S.btn(false), fontSize:"11px", color:"#d64545" }}>🗑 Elimina</button>
                            </div>
                          </div>

                          {w.notes && (
                            <div style={{ padding:"10px 14px", background:"#faf7f2", borderLeft:"3px solid #b8924a", borderRadius:"4px", marginBottom:"16px", fontSize:"12px", color:"#3a3a3a", fontStyle:"italic" }}>
                              {w.notes}
                            </div>
                          )}

                          {/* TOTAL OVERVIEW */}
                          <div style={{ marginBottom:"18px" }}>
                            <div style={{ fontSize:"10px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px", fontWeight:700 }}>📈 Totali</div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"10px" }}>
                              <AdvKpiCard label="Spesa totale" value={fmtEuro(k?.total_spesa || 0)} delta={kPrev ? deltaPct(k?.total_spesa || 0, kPrev.total_spesa) : null} invertDelta />
                              <AdvKpiCard label="Revenue tot." value={fmtEuro(k?.total_revenue || 0)} delta={kPrev ? deltaPct(k?.total_revenue || 0, kPrev.total_revenue) : null} />
                              <AdvKpiCard label="Acquisti" value={String(k?.total_acquisti || 0)} delta={kPrev ? deltaPct(k?.total_acquisti || 0, kPrev.total_acquisti) : null} />
                              <AdvKpiCard label="ROAS totale" value={`${(k?.total_roas || 0).toFixed(2)}x`} delta={kPrev ? deltaPct(k?.total_roas || 0, kPrev.total_roas) : null} highlight={(k?.total_roas || 0) >= 3 ? "good" : (k?.total_roas || 0) < 2 ? "bad" : "warn"} />
                            </div>
                          </div>

                          {/* ACQUISIZIONE */}
                          <div style={{ marginBottom:"18px", padding:"14px", background:"#ffffff", border:"1px solid #e8ddd0", borderRadius:"8px" }}>
                            <div style={{ fontSize:"11px", fontWeight:700, color:"#1a1a1a", marginBottom:"10px", letterSpacing:"1px" }}>🎯 ACQUISIZIONE</div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"10px" }}>
                              <AdvKpiCard label="Spesa" value={fmtEuro(w.acq_spesa || 0)} delta={prev ? deltaPct(w.acq_spesa || 0, prev.acq_spesa || 0) : null} invertDelta />
                              <AdvKpiCard label="Acquisti" value={String(w.acq_acquisti || 0)} delta={prev ? deltaPct(w.acq_acquisti || 0, prev.acq_acquisti || 0) : null} />
                              <AdvKpiCard label="CPA" value={fmtEuro(k?.acq_cpa || 0)} delta={kPrev ? deltaPct(k?.acq_cpa || 0, kPrev.acq_cpa) : null} invertDelta highlight={(k?.acq_cpa || 0) > 0 && (k?.acq_cpa || 0) < 20 ? "good" : (k?.acq_cpa || 0) > 25 ? "bad" : "neutral"} />
                              <AdvKpiCard label="ROAS" value={`${(k?.acq_roas || 0).toFixed(2)}x`} delta={kPrev ? deltaPct(k?.acq_roas || 0, kPrev.acq_roas) : null} highlight={(k?.acq_roas || 0) >= 3 ? "good" : (k?.acq_roas || 0) < 2 ? "bad" : "warn"} />
                            </div>
                            {(w.acq_impression > 0 || w.acq_click > 0) && (
                              <div style={{ display:"flex", gap:"24px", marginTop:"10px", paddingTop:"10px", borderTop:"1px dashed #e8ddd0", fontSize:"11px", color:"#5a5a5a" }}>
                                <span>Impression: <b style={{color:"#1a1a1a"}}>{(w.acq_impression||0).toLocaleString("it-IT")}</b></span>
                                <span>Click: <b style={{color:"#1a1a1a"}}>{(w.acq_click||0).toLocaleString("it-IT")}</b></span>
                                <span>CTR: <b style={{color:"#1a1a1a"}}>{(k?.acq_ctr || 0).toFixed(2)}%</b></span>
                                <span>CPC: <b style={{color:"#1a1a1a"}}>{fmtEuro(k?.acq_cpc || 0)}</b></span>
                              </div>
                            )}
                          </div>

                          {/* RETARGETING */}
                          <div style={{ marginBottom:"18px", padding:"14px", background:"#ffffff", border:"1px solid #e8ddd0", borderRadius:"8px" }}>
                            <div style={{ fontSize:"11px", fontWeight:700, color:"#1a1a1a", marginBottom:"10px", letterSpacing:"1px" }}>🔄 RETARGETING</div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"10px" }}>
                              <AdvKpiCard label="Spesa" value={fmtEuro(w.ret_spesa || 0)} delta={prev ? deltaPct(w.ret_spesa || 0, prev.ret_spesa || 0) : null} invertDelta />
                              <AdvKpiCard label="Acquisti" value={String(w.ret_acquisti || 0)} delta={prev ? deltaPct(w.ret_acquisti || 0, prev.ret_acquisti || 0) : null} />
                              <AdvKpiCard label="CPA" value={fmtEuro(k?.ret_cpa || 0)} delta={kPrev ? deltaPct(k?.ret_cpa || 0, kPrev.ret_cpa) : null} invertDelta highlight={(k?.ret_cpa || 0) > 0 && (k?.ret_cpa || 0) < 15 ? "good" : (k?.ret_cpa || 0) > 20 ? "bad" : "neutral"} />
                              <AdvKpiCard label="ROAS" value={`${(k?.ret_roas || 0).toFixed(2)}x`} delta={kPrev ? deltaPct(k?.ret_roas || 0, kPrev.ret_roas) : null} highlight={(k?.ret_roas || 0) >= 4 ? "good" : (k?.ret_roas || 0) < 3 ? "bad" : "warn"} />
                            </div>
                          </div>

                          {/* TRAFFICO */}
                          {(w.tra_spesa > 0 || w.tra_impression > 0) && (
                            <div style={{ padding:"14px", background:"#ffffff", border:"1px solid #e8ddd0", borderRadius:"8px" }}>
                              <div style={{ fontSize:"11px", fontWeight:700, color:"#1a1a1a", marginBottom:"10px", letterSpacing:"1px" }}>🚀 TRAFFICO</div>
                              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"10px" }}>
                                <AdvKpiCard label="Spesa" value={fmtEuro(w.tra_spesa || 0)} delta={prev ? deltaPct(w.tra_spesa || 0, prev.tra_spesa || 0) : null} invertDelta />
                                <AdvKpiCard label="Click" value={(w.tra_click || 0).toLocaleString("it-IT")} delta={prev ? deltaPct(w.tra_click || 0, prev.tra_click || 0) : null} />
                                <AdvKpiCard label="CTR" value={`${(k?.tra_ctr || 0).toFixed(2)}%`} delta={kPrev ? deltaPct(k?.tra_ctr || 0, kPrev.tra_ctr) : null} />
                                <AdvKpiCard label="CPC" value={fmtEuro(k?.tra_cpc || 0)} delta={kPrev ? deltaPct(k?.tra_cpc || 0, kPrev.tra_cpc) : null} invertDelta />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* COMPARE */}
                      {advSubTab === "compare" && (
                        <div>
                          <div style={{ fontSize:"15px", fontWeight:700, color:"#1a1a1a", marginBottom:"6px" }}>Confronto libero tra settimane</div>
                          <div style={{ fontSize:"11px", color:"#9a9089", marginBottom:"14px" }}>Seleziona 2-4 settimane da confrontare</div>
                          <div style={{ display:"flex", gap:"6px", marginBottom:"16px", flexWrap:"wrap" }}>
                            {advWeeks.map((wk: any) => {
                              const selected = advCompareIds.includes(wk.id);
                              return (
                                <button
                                  key={wk.id}
                                  onClick={() => {
                                    if (selected) setAdvCompareIds(advCompareIds.filter(x => x !== wk.id));
                                    else if (advCompareIds.length < 4) setAdvCompareIds([...advCompareIds, wk.id]);
                                  }}
                                  style={{
                                    padding:"6px 12px", borderRadius:"6px", fontSize:"11px",
                                    border:`1px solid ${selected ? "#b8924a" : "#e8ddd0"}`,
                                    background: selected ? "#b8924a" : "#ffffff",
                                    color: selected ? "#ffffff" : "#3a3a3a",
                                    cursor: (!selected && advCompareIds.length >= 4) ? "not-allowed" : "pointer",
                                    opacity: (!selected && advCompareIds.length >= 4) ? 0.5 : 1,
                                    fontWeight: selected ? 600 : 400
                                  }}
                                >W{wk.week_number}{wk.week_label && ` · ${wk.week_label.slice(0,18)}`}</button>
                              );
                            })}
                          </div>

                          {advCompareIds.length < 2 ? (
                            <div style={{ padding:"30px", textAlign:"center", color:"#9a9089", fontSize:"12px", background:"#faf7f2", borderRadius:"8px" }}>
                              Seleziona almeno 2 settimane per vedere il confronto
                            </div>
                          ) : (
                            <div style={{ overflow:"auto", border:"1px solid #e8ddd0", borderRadius:"8px", background:"#ffffff" }}>
                              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
                                <thead>
                                  <tr style={{ background:"#faf7f2", borderBottom:"1px solid #e8ddd0" }}>
                                    <th style={{ padding:"10px 14px", textAlign:"left", fontSize:"10px", textTransform:"uppercase", letterSpacing:"1px", color:"#7a7a7a", fontWeight:700 }}>Metrica</th>
                                    {advCompareIds.map(id => {
                                      const wk = advWeeks.find((x: any) => x.id === id);
                                      return <th key={id} style={{ padding:"10px 14px", textAlign:"right", fontSize:"10px", textTransform:"uppercase", letterSpacing:"1px", color:"#7a7a7a", fontWeight:700 }}>W{wk?.week_number}</th>;
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    { label:"Spesa totale", key:"total_spesa", fmt:(v:number)=>fmtEuro(v), highBetter:false },
                                    { label:"Revenue totale", key:"total_revenue", fmt:(v:number)=>fmtEuro(v), highBetter:true },
                                    { label:"Acquisti tot.", key:"total_acquisti", fmt:(v:number)=>String(v), highBetter:true },
                                    { label:"ROAS totale", key:"total_roas", fmt:(v:number)=>`${v.toFixed(2)}x`, highBetter:true },
                                    { label:"—", key:"sep1" },
                                    { label:"Spesa acquisizione", key:"acq_spesa", fmt:(v:number)=>fmtEuro(v), raw:true, highBetter:false },
                                    { label:"CPA acquisizione", key:"acq_cpa", fmt:(v:number)=>fmtEuro(v), highBetter:false },
                                    { label:"ROAS acquisizione", key:"acq_roas", fmt:(v:number)=>`${v.toFixed(2)}x`, highBetter:true },
                                    { label:"—", key:"sep2" },
                                    { label:"Spesa retargeting", key:"ret_spesa", fmt:(v:number)=>fmtEuro(v), raw:true, highBetter:false },
                                    { label:"CPA retargeting", key:"ret_cpa", fmt:(v:number)=>fmtEuro(v), highBetter:false },
                                    { label:"ROAS retargeting", key:"ret_roas", fmt:(v:number)=>`${v.toFixed(2)}x`, highBetter:true },
                                  ].map((row, ri) => {
                                    if (row.key.startsWith("sep")) {
                                      return <tr key={row.key}><td colSpan={advCompareIds.length+1} style={{ borderTop:"1px dashed #e8ddd0", height:"4px" }}></td></tr>;
                                    }
                                    const values = advCompareIds.map(id => {
                                      const wk = advWeeks.find((x: any) => x.id === id);
                                      if (!wk) return 0;
                                      if (row.raw) return Number(wk[row.key]) || 0;
                                      const kk = deriveAdvKPIs(wk);
                                      return (kk as any)?.[row.key] || 0;
                                    });
                                    const maxV = Math.max(...values), minV = Math.min(...values);
                                    return (
                                      <tr key={row.key} style={{ borderBottom:"1px solid #f5f0ea" }}>
                                        <td style={{ padding:"9px 14px", color:"#3a3a3a", fontWeight:500 }}>{row.label}</td>
                                        {values.map((v, i) => {
                                          const isBest = row.highBetter !== undefined && values.length > 1 && (row.highBetter ? v === maxV : v === minV) && maxV !== minV;
                                          return (
                                            <td key={i} style={{ padding:"9px 14px", textAlign:"right", color: isBest ? "#1a9d94" : "#1a1a1a", fontWeight: isBest ? 700 : 400, fontFamily:"'Space Mono', monospace" }}>
                                              {row.fmt!(v)}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* TREND */}
                      {advSubTab === "trend" && (
                        <div>
                          <div style={{ fontSize:"15px", fontWeight:700, color:"#1a1a1a", marginBottom:"14px" }}>Trend storico</div>
                          {(() => {
                            const sorted = [...advWeeks].sort((a: any, b: any) => a.week_number - b.week_number);
                            const trendMetrics = [
                              { key:"total_spesa", label:"Spesa totale settimanale", color:"#d64545", fmt:(v:number)=>fmtEuro(v) },
                              { key:"total_revenue", label:"Revenue totale", color:"#1a9d94", fmt:(v:number)=>fmtEuro(v) },
                              { key:"total_roas", label:"ROAS totale", color:"#b8924a", fmt:(v:number)=>`${v.toFixed(2)}x` },
                              { key:"acq_roas", label:"ROAS acquisizione", color:"#7c5cd4", fmt:(v:number)=>`${v.toFixed(2)}x` },
                              { key:"ret_roas", label:"ROAS retargeting", color:"#10b981", fmt:(v:number)=>`${v.toFixed(2)}x` },
                            ];
                            return (
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                                {trendMetrics.map(m => {
                                  const values = sorted.map((wk: any) => {
                                    const kk = deriveAdvKPIs(wk);
                                    return (kk as any)?.[m.key] || 0;
                                  });
                                  const maxV = Math.max(...values, 0.01);
                                  return (
                                    <div key={m.key} style={{ padding:"14px", background:"#ffffff", border:"1px solid #e8ddd0", borderRadius:"8px" }}>
                                      <div style={{ fontSize:"11px", color:"#7a7a7a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px", fontWeight:700 }}>{m.label}</div>
                                      <div style={{ display:"flex", alignItems:"flex-end", gap:"4px", height:"80px", marginBottom:"6px" }}>
                                        {values.map((v, i) => (
                                          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
                                            <div style={{
                                              width:"100%", background:m.color,
                                              height:`${(v/maxV)*100}%`,
                                              minHeight:"3px", borderRadius:"3px 3px 0 0",
                                              opacity: 0.85
                                            }} title={`W${sorted[i].week_number}: ${m.fmt(v)}`} />
                                          </div>
                                        ))}
                                      </div>
                                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"9px", color:"#9a9089", fontFamily:"'Space Mono', monospace" }}>
                                        {sorted.map((wk: any, i: number) => <span key={i}>W{wk.week_number}</span>)}
                                      </div>
                                      <div style={{ marginTop:"6px", fontSize:"11px", color:"#3a3a3a" }}>
                                        Ultimo: <b>{m.fmt(values[values.length-1])}</b>
                                        {values.length >= 2 && (
                                          <span style={{ marginLeft:"10px", color: deltaPct(values[values.length-1], values[values.length-2])?.color }}>
                                            {deltaPct(values[values.length-1], values[values.length-2])?.label}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* DIAGNOSI AI */}
                      {advSubTab === "diagnosi" && (
                        <div>
                          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"14px", gap:"10px", flexWrap:"wrap" }}>
                            <div>
                              <div style={{ fontSize:"15px", fontWeight:700, color:"#1a1a1a" }}>Diagnosi AI — W{w.week_number}</div>
                              <div style={{ fontSize:"11px", color:"#9a9089", marginTop:"2px" }}>
                                {w.ai_diagnosis_at ? `Generata ${formatAgo(w.ai_diagnosis_at)}` : "Nessuna diagnosi ancora generata"}
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                              <input
                                type="text"
                                value={advDiagnoseFocus}
                                onChange={e => setAdvDiagnoseFocus(e.target.value)}
                                placeholder="Focus opzionale (es. perché il CPA è salito?)"
                                style={{ ...S.input, width:"320px", fontSize:"11px" }}
                              />
                              <button
                                onClick={() => diagnoseAdvWeek(w.id, advDiagnoseFocus)}
                                disabled={advDiagnosing}
                                style={{ ...S.btn(true), fontSize:"11px", opacity: advDiagnosing ? 0.6 : 1 }}
                              >
                                {advDiagnosing ? "Analizzando..." : (w.ai_diagnosis ? "↻ Rigenera" : "✨ Genera diagnosi")}
                              </button>
                            </div>
                          </div>

                          {advDiagnosing && (
                            <div style={{ padding:"40px", textAlign:"center", background:"#faf7f2", borderRadius:"8px", color:"#7a7a7a" }}>
                              <div style={{ display:"inline-block", width:"24px", height:"24px", border:"3px solid #e8ddd0", borderTopColor:"#b8924a", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                              <div style={{ marginTop:"12px", fontSize:"12px" }}>Claude sta analizzando i dati...</div>
                            </div>
                          )}

                          {!advDiagnosing && w.ai_diagnosis && (
                            <div style={{ padding:"20px 24px", background:"#ffffff", border:"1px solid #e8ddd0", borderRadius:"10px", fontSize:"13px", lineHeight:1.6, color:"#1a1a1a", whiteSpace:"pre-wrap", fontFamily:"system-ui, -apple-system, sans-serif" }}>
                              {w.ai_diagnosis}
                            </div>
                          )}

                          {!advDiagnosing && !w.ai_diagnosis && (
                            <div style={{ padding:"40px 24px", textAlign:"center", background:"#faf7f2", borderRadius:"10px", color:"#7a7a7a", fontSize:"13px" }}>
                              Clicca su "Genera diagnosi" per far analizzare a Claude i dati di questa settimana
                            </div>
                          )}
                        </div>
                      )}
                      {/* TEORIA */}
                      {advSubTab === "teoria" && (
                        <div style={{ maxWidth:"760px" }}>
                          <div style={{ fontSize:"18px", fontWeight:700, color:"#1a1a1a", marginBottom:"4px" }}>Guida ai report ADV</div>
                          <div style={{ fontSize:"11px", color:"#9a9089", marginBottom:"20px" }}>La tua bussola per capire cosa significano i numeri, gli acronimi e le metriche di ogni report settimanale.</div>

                          <TheorySection title="🏗️ La struttura delle campagne Meta">
                            <p>Il sistema pubblicitario di Meta (Facebook + Instagram) funziona su 3 livelli annidati, come una matrioska:</p>
                            <ol style={{ paddingLeft:"20px", margin:"8px 0" }}>
                              <li><b>Campagna</b> — il contenitore principale. Si definisce l'obiettivo: vendite, traffico, visibilità.</li>
                              <li><b>Gruppo di inserzioni (Ad Set)</b> — si definisce a chi mostrare le ads: età, interessi, città, comportamenti.</li>
                              <li><b>Inserzione (Ad)</b> — la creatività vera e propria: immagine/video + copy + CTA.</li>
                            </ol>
                            <p>Nel report settimanale trovi sempre <b>3 campagne distinte</b>: Acquisizione, Retargeting e Traffico. Hanno obiettivi e metriche diverse e <b>non vanno mai confuse tra loro</b>.</p>
                          </TheorySection>

                          <TheorySection title="💰 CPA — Costo Per Acquisizione">
                            <p><b>CPA = quanto ti costa, in media, generare un acquisto.</b> Misura l'efficienza di spesa per ogni singolo ordine.</p>
                            <p><b>Formula:</b> <code style={{ background:"#faf7f2", padding:"2px 6px", borderRadius:"3px", fontSize:"11px" }}>CPA = Spesa totale ÷ Numero acquisti</code></p>
                            <p><b>Come valutarlo per Occhiale Matto</b> (prezzo medio €29,99):</p>
                            <ul style={{ paddingLeft:"20px", margin:"6px 0" }}>
                              <li>CPA sotto <b style={{color:"#1a9d94"}}>€10</b> → eccellente</li>
                              <li>CPA tra <b style={{color:"#b8924a"}}>€10 e €18</b> → buono, sostenibile</li>
                              <li>CPA tra <b style={{color:"#d97706"}}>€18 e €25</b> → margini sottili, attenzione</li>
                              <li>CPA sopra <b style={{color:"#d64545"}}>€25</b> → critico, si perde su quasi ogni acquisto</li>
                            </ul>
                            <p>Regola pratica: <b>CPA dovrebbe stare sotto il 30-40% del prezzo medio ordine</b>. Sopra il 50% sei in perdita quasi certa una volta sommati costi prodotto, spedizione e overhead.</p>
                          </TheorySection>

                          <TheorySection title="📊 ROAS — il numero più importante">
                            <p><b>ROAS</b> (Return On Ad Spend) <b>= per ogni €1 investito in pubblicità, quanti € di fatturato hai generato?</b> È la metrica regina dell'e-commerce.</p>
                            <p><b>Formula:</b> <code style={{ background:"#faf7f2", padding:"2px 6px", borderRadius:"3px", fontSize:"11px" }}>ROAS = Revenue ÷ Spesa</code></p>
                            <p><b>La scala del ROAS</b> (per acquisizione cold):</p>
                            <ul style={{ paddingLeft:"20px", margin:"6px 0" }}>
                              <li><b style={{color:"#d64545"}}>Sotto 2.0x</b> → perdita quasi certa, il prodotto non si paga da solo</li>
                              <li><b style={{color:"#d97706"}}>2.0x - 3.0x</b> → break-even, copri appena i costi</li>
                              <li><b style={{color:"#b8924a"}}>3.0x - 4.0x</b> → soddisfacente, c'è marginalità</li>
                              <li><b style={{color:"#1a9d94"}}>Sopra 4.0x</b> → ottimo, puoi pensare a scalare</li>
                            </ul>
                            <p>⚠️ Il <b>retargeting</b> ha standard più alti: deve stare <b>sopra 4x</b> per essere considerato sano, idealmente 5-7x. Se scende sotto 3x significa che il bacino caldo si sta esaurendo.</p>
                          </TheorySection>

                          <TheorySection title="🆚 Acquisizione vs Retargeting (la distinzione chiave)">
                            <p>Sono <b>due campagne con obiettivi completamente diversi</b> e non vanno mai confrontate direttamente.</p>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginTop:"10px" }}>
                              <div style={{ padding:"12px", background:"#faf7f2", borderRadius:"7px" }}>
                                <div style={{ fontWeight:700, marginBottom:"6px", color:"#1a1a1a" }}>🎯 Acquisizione (cold)</div>
                                <div style={{ fontSize:"11px", color:"#3a3a3a", lineHeight:1.5 }}>Mostra le ads a chi non ti conosce. Obiettivo: portare nuovi clienti. ROAS più basso, volumi più alti, fa girare l'algoritmo. <b>È il motore del fatturato.</b></div>
                              </div>
                              <div style={{ padding:"12px", background:"#faf7f2", borderRadius:"7px" }}>
                                <div style={{ fontWeight:700, marginBottom:"6px", color:"#1a1a1a" }}>🔄 Retargeting (warm)</div>
                                <div style={{ fontSize:"11px", color:"#3a3a3a", lineHeight:1.5 }}>Mostra le ads a chi ti ha già visto (visite sito, IG, carrelli abbandonati). ROAS molto più alto, volumi più bassi. <b>Recupera vendite altrimenti perse.</b></div>
                              </div>
                            </div>
                            <p style={{ marginTop:"10px" }}>📐 <b>Mix sano</b>: ~85-90% budget su Acquisizione, ~10-15% su Retargeting. Se il retargeting consuma più del 20% del budget, probabilmente stai bruciando audience troppo veloce.</p>
                          </TheorySection>

                          <TheorySection title="🚀 La campagna Traffico — a cosa serve davvero">
                            <p>La campagna Traffico <b>non è ottimizzata per le vendite dirette</b>. Il suo scopo è portare visite qualificate al profilo Instagram, costruire brand awareness e alimentare il pubblico del retargeting.</p>
                            <p><b>Non aspettarti acquisti diretti da questa campagna.</b> Il suo ROI va misurato indirettamente:</p>
                            <p style={{ padding:"10px 14px", background:"#faf7f2", borderLeft:"3px solid #b8924a", borderRadius:"4px", margin:"8px 0", fontSize:"11px" }}>
                              Più persone entrano nel funnel via traffico → più il retargeting ha pubblico su cui lavorare → più acquisti vengono recuperati nel tempo.
                            </p>
                            <p><b>KPI da monitorare</b>: costo per click (CPC). Sotto €0.20 va bene per accessori. Sopra €0.35 significa che il pubblico è saturo o il copy non ingaggia.</p>
                          </TheorySection>

                          <TheorySection title="✅ Checklist settimanale">
                            <p>Usa questa checklist ogni settimana per leggere autonomamente il report PRIMA di parlare col media buyer:</p>
                            <table style={{ width:"100%", borderCollapse:"collapse", marginTop:"8px", fontSize:"11px" }}>
                              <thead>
                                <tr style={{ background:"#faf7f2" }}>
                                  <th style={{ padding:"6px 8px", textAlign:"left", fontWeight:700, color:"#3a3a3a", borderBottom:"1px solid #e8ddd0" }}>Metrica</th>
                                  <th style={{ padding:"6px 8px", textAlign:"left", fontWeight:700, color:"#1a9d94", borderBottom:"1px solid #e8ddd0" }}>OK ✓</th>
                                  <th style={{ padding:"6px 8px", textAlign:"left", fontWeight:700, color:"#d64545", borderBottom:"1px solid #e8ddd0" }}>Allarme ⚠</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>ROAS acquisizione</td><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>Sopra 3-4x</td><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>Sotto 2x → perdita</td></tr>
                                <tr><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>CPA</td><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>Sotto 30-40% del prezzo</td><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>Supera 50% prezzo</td></tr>
                                <tr><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>Trend ROAS</td><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>Stabile o in crescita</td><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>In calo = creative fatigue</td></tr>
                                <tr><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>Acquisti</td><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>Volume stabile a parità budget</td><td style={{ padding:"6px 8px", borderBottom:"1px solid #f5f0ea" }}>Meno acquisti a parità spesa</td></tr>
                                <tr><td style={{ padding:"6px 8px" }}>CPC traffico</td><td style={{ padding:"6px 8px" }}>Sotto €0.20</td><td style={{ padding:"6px 8px" }}>Sopra €0.35 → pubblico saturo</td></tr>
                              </tbody>
                            </table>
                          </TheorySection>

                          <TheorySection title="🎨 Creative Fatigue — quando le ads si stancano">
                            <p>Quando una campagna funziona bene e poi inizia a perdere performance, la causa più frequente è la <b>stanchezza creativa</b>. Il pubblico ha visto troppe volte la stessa immagine/video e smette di cliccarci.</p>
                            <p>Su Meta, una creatività ha <b>vita media di 2-6 settimane</b> prima di perdere efficacia. Più scali il budget, più velocemente si esaurisce.</p>
                            <p><b>Segnali di fatigue</b>:</p>
                            <ul style={{ paddingLeft:"20px", margin:"6px 0" }}>
                              <li>ROAS in calo continuo per 2+ settimane consecutive</li>
                              <li>CPA in salita progressiva</li>
                              <li>CTR (click-through rate) che scende</li>
                              <li>Frequenza per utente che sale (Meta lo mostra nel Business Manager)</li>
                            </ul>
                            <p>💡 <b>Soluzione</b>: pianifica sempre un flusso continuo di nuovi contenuti. Idealmente 2-3 nuove creative ogni 10-14 giorni.</p>
                          </TheorySection>

                          <TheorySection title="📈 Quando scalare il budget?">
                            <p>Se il ROAS è stabile e sopra il break-even, puoi aumentare il budget. <b>Regola d'oro</b>:</p>
                            <ul style={{ paddingLeft:"20px", margin:"6px 0" }}>
                              <li>Non aumentare mai più del <b>20-30% alla volta</b></li>
                              <li>Aspetta almeno <b>3-5 giorni</b> per vedere l'effetto prima di modificare ancora</li>
                              <li>Aumenti bruschi rompono l'algoritmo e fanno ripartire la fase di apprendimento</li>
                            </ul>
                            <p>Se il ROAS scende dopo lo scaling: torna allo step precedente e aspetta che si stabilizzi.</p>
                          </TheorySection>

                          <TheorySection title="📖 Glossario rapido">
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 14px", fontSize:"11px" }}>
                              <div><b>CPA</b>: Cost Per Acquisition</div>
                              <div><b>ROAS</b>: Return On Ad Spend</div>
                              <div><b>CPC</b>: Cost Per Click</div>
                              <div><b>CTR</b>: Click-Through Rate</div>
                              <div><b>CPM</b>: Cost Per Mille (mille impressioni)</div>
                              <div><b>AOV</b>: Average Order Value</div>
                              <div><b>LTV</b>: Lifetime Value</div>
                              <div><b>MER</b>: Marketing Efficiency Ratio (fatturato totale / spesa ADV totale)</div>
                              <div><b>Cold</b>: pubblico nuovo, mai interagito</div>
                              <div><b>Warm</b>: pubblico caldo, già esposto al brand</div>
                              <div><b>ASC</b>: Advantage+ Shopping Campaign</div>
                              <div><b>BAU</b>: Business As Usual</div>
                            </div>
                          </TheorySection>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>)}

        {/* ═══ COVER GENERATOR ═══ */}
        {tab==="cover" && (<div>
          <div style={{ marginBottom:"20px" }}>
            <div style={{ fontSize:"18px", fontWeight:700, color:"#1a1a1a" }}>Cover prodotto · Nano Banana</div>
            <div style={{ fontSize:"11px", color:"#9a9089", marginTop:"4px" }}>
              Prompt standard per generare lifestyle cover con modelli che indossano gli occhiali Occhiale Matto.
            </div>
          </div>

          {/* WORKFLOW STEPS */}
          <div style={{ marginBottom:"18px", padding:"14px 18px", background:"#faf7f2", borderRadius:"10px", border:"1px solid #e8ddd0" }}>
            <div style={{ fontSize:"11px", fontWeight:700, color:"#1a1a1a", marginBottom:"10px", letterSpacing:"1px", textTransform:"uppercase" }}>🎬 Workflow</div>
            <ol style={{ paddingLeft:"22px", margin:0, fontSize:"12px", color:"#3a3a3a", lineHeight:1.7 }}>
              <li>Apri <a href="https://higgsfield.ai" target="_blank" rel="noopener noreferrer" style={{ color:"#b8924a", fontWeight:600 }}>Higgsfield</a> e seleziona <b>Nano Banana Pro</b></li>
              <li>Carica <b>3 immagini reference</b>:
                <ul style={{ paddingLeft:"18px", marginTop:"3px" }}>
                  <li>Foto del modello (per pose, mood, lighting, non per il volto)</li>
                  <li>Foto frontale dell'occhiale Occhiale Matto</li>
                  <li>Foto laterale dell'occhiale Occhiale Matto</li>
                </ul>
              </li>
              <li>Copia il prompt qui sotto e incollalo nel campo prompt di Nano Banana</li>
              <li>Genera. Se il modello somiglia troppo al reference, rigenera (il prompt impone identità diversa)</li>
              <li>Scarica il risultato e usalo per le cover di Instagram, Shopify, email</li>
            </ol>
          </div>

          {/* PROMPT BLOCK */}
          <div style={{ background:"#ffffff", border:"1px solid #e8ddd0", borderRadius:"10px", overflow:"hidden" }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #e8ddd0", background:"#faf7f2", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"8px" }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:"#1a1a1a", letterSpacing:"1px", textTransform:"uppercase" }}>📝 Prompt standard (inglese, ottimizzato per Nano Banana)</div>
              <button
                onClick={() => {
                  const promptText = `Create a realistic close-up portrait of a model wearing the sunglasses shown in the attached product image.\n\nIMPORTANT RULES:\n- The sunglasses must remain EXACTLY the same as in the product photo: same frame shape, same colors, same lenses, same materials and proportions. Do not redesign or reinterpret the glasses.\n- The reference model image is ONLY for inspiration (pose, mood, composition, lighting). The generated person must NOT be the same individual.\n- Create a DIFFERENT model with different facial features, bone structure, and identity. The person can have a similar vibe or style, but must clearly be a different individual.\n- Change facial traits such as jawline, nose shape, eyes, lips, and facial proportions so the face is recognizably different from the reference model.\n- The sunglasses must fit naturally on the face with realistic lighting, reflections, and shadows.\n- Keep the original background from the reference image unchanged.\n- Maintain the same camera angle and composition.\n\nStyle:\nUltra-realistic fashion photography, natural skin texture, high-end lifestyle campaign quality.\n\nFraming:\nClose-up portrait (head and upper shoulders), centered composition, sharp focus on the face and sunglasses.\n\nLighting:\nNatural cinematic lighting consistent with the original image.\n\nGoal:\nA believable lifestyle photo where a new model (different from the reference person) naturally wears the exact sunglasses from the product image.`;
                  navigator.clipboard.writeText(promptText).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
                style={{
                  padding:"7px 14px",
                  fontSize:"11px",
                  fontWeight:600,
                  borderRadius:"6px",
                  border:"none",
                  background: copied ? "#1a9d94" : "linear-gradient(135deg,#b8924a,#8a6630)",
                  color:"#ffffff",
                  cursor:"pointer"
                }}
              >{copied ? "✓ Copiato!" : "📋 Copia prompt"}</button>
            </div>
            <pre style={{
              margin:0,
              padding:"18px 22px",
              fontSize:"12px",
              lineHeight:1.6,
              color:"#3a3a3a",
              fontFamily:"'Space Mono', monospace",
              whiteSpace:"pre-wrap",
              wordBreak:"break-word",
              background:"#ffffff"
            }}>{`Create a realistic close-up portrait of a model wearing the sunglasses shown in the attached product image.

IMPORTANT RULES:
- The sunglasses must remain EXACTLY the same as in the product photo: same frame shape, same colors, same lenses, same materials and proportions. Do not redesign or reinterpret the glasses.
- The reference model image is ONLY for inspiration (pose, mood, composition, lighting). The generated person must NOT be the same individual.
- Create a DIFFERENT model with different facial features, bone structure, and identity. The person can have a similar vibe or style, but must clearly be a different individual.
- Change facial traits such as jawline, nose shape, eyes, lips, and facial proportions so the face is recognizably different from the reference model.
- The sunglasses must fit naturally on the face with realistic lighting, reflections, and shadows.
- Keep the original background from the reference image unchanged.
- Maintain the same camera angle and composition.

Style:
Ultra-realistic fashion photography, natural skin texture, high-end lifestyle campaign quality.

Framing:
Close-up portrait (head and upper shoulders), centered composition, sharp focus on the face and sunglasses.

Lighting:
Natural cinematic lighting consistent with the original image.

Goal:
A believable lifestyle photo where a new model (different from the reference person) naturally wears the exact sunglasses from the product image.`}</pre>
          </div>

          {/* TIPS */}
          <div style={{ marginTop:"16px", padding:"12px 16px", background:"#faf7f2", borderLeft:"3px solid #b8924a", borderRadius:"4px", fontSize:"12px", color:"#3a3a3a", lineHeight:1.6 }}>
            <div style={{ fontWeight:700, marginBottom:"4px" }}>💡 Tips operativi</div>
            <ul style={{ paddingLeft:"18px", margin:"4px 0 0" }}>
              <li>Foto prodotto: usa scatti puliti su sfondo neutro, frame ben visibile</li>
              <li>Foto modello reference: scegli una posa coerente con il mood OM (urban, fashion, lifestyle)</li>
              <li>Se l'occhiale generato è diverso dall'originale, rigenera 2-3 volte. Nano Banana migliora con le iterazioni</li>
              <li>Per varianti, cambia solo la foto modello reference mantenendo lo stesso occhiale</li>
            </ul>
          </div>
        </div>)}
      </div>

      {/* Global keyframes for spin */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
