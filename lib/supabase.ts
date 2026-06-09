import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing — ADV features disabled"
  );
}

/**
 * Server-side Supabase client with SERVICE_ROLE key.
 * Use ONLY in API routes (server). Bypasses RLS.
 * NEVER import this into client components.
 */
export function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase admin client not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars."
    );
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });
}

export type AdvWeek = {
  id: string;
  week_number: number;
  week_label: string | null;
  week_start: string; // ISO date
  week_end: string;   // ISO date
  notes: string | null;

  // Acquisizione
  acq_spesa: number;
  acq_impression: number;
  acq_click: number;
  acq_acquisti: number;
  acq_revenue: number;

  // Retargeting
  ret_spesa: number;
  ret_impression: number;
  ret_click: number;
  ret_acquisti: number;
  ret_revenue: number;

  // Traffico
  tra_spesa: number;
  tra_impression: number;
  tra_click: number;

  // AI diagnosis
  ai_diagnosis: string | null;
  ai_diagnosis_at: string | null;

  created_at: string;
  updated_at: string;
};

/**
 * Compute derived KPIs from raw data.
 */
export function deriveKPIs(week: AdvWeek) {
  const acq_cpa = week.acq_acquisti > 0 ? week.acq_spesa / week.acq_acquisti : 0;
  const acq_roas = week.acq_spesa > 0 ? week.acq_revenue / week.acq_spesa : 0;
  const acq_ctr = week.acq_impression > 0 ? (week.acq_click / week.acq_impression) * 100 : 0;
  const acq_cpc = week.acq_click > 0 ? week.acq_spesa / week.acq_click : 0;

  const ret_cpa = week.ret_acquisti > 0 ? week.ret_spesa / week.ret_acquisti : 0;
  const ret_roas = week.ret_spesa > 0 ? week.ret_revenue / week.ret_spesa : 0;
  const ret_ctr = week.ret_impression > 0 ? (week.ret_click / week.ret_impression) * 100 : 0;
  const ret_cpc = week.ret_click > 0 ? week.ret_spesa / week.ret_click : 0;

  const tra_ctr = week.tra_impression > 0 ? (week.tra_click / week.tra_impression) * 100 : 0;
  const tra_cpc = week.tra_click > 0 ? week.tra_spesa / week.tra_click : 0;

  const total_spesa = week.acq_spesa + week.ret_spesa + week.tra_spesa;
  const total_revenue = week.acq_revenue + week.ret_revenue;
  const total_acquisti = week.acq_acquisti + week.ret_acquisti;
  const total_roas = total_spesa > 0 ? total_revenue / total_spesa : 0;

  return {
    acq_cpa, acq_roas, acq_ctr, acq_cpc,
    ret_cpa, ret_roas, ret_ctr, ret_cpc,
    tra_ctr, tra_cpc,
    total_spesa, total_revenue, total_acquisti, total_roas
  };
}
