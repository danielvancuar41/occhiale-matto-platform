import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, AdvWeek } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/adv
 * Returns all ADV weeks, ordered by week_number desc.
 */
export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("adv_weeks")
      .select("*")
      .order("week_number", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ ok: true, weeks: data || [] });
  } catch (err: any) {
    console.error("[/api/adv] GET error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/adv
 * Body: partial AdvWeek. Auto-fills missing required fields:
 * - week_number: max(existing) + 1
 * - week_start: today - 7 days
 * - week_end: today
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getAdminClient();

    // Auto-fill missing required fields
    let week_number = Number(body.week_number);
    let week_start = body.week_start;
    let week_end = body.week_end;

    if (!week_number || isNaN(week_number)) {
      const { data: maxRow } = await supabase
        .from("adv_weeks")
        .select("week_number")
        .order("week_number", { ascending: false })
        .limit(1)
        .single();
      week_number = (maxRow?.week_number || 0) + 1;
    }

    if (!week_start || !week_end) {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      if (!week_start) week_start = sevenDaysAgo.toISOString().slice(0, 10);
      if (!week_end) week_end = today.toISOString().slice(0, 10);
    }

    const insertData: Partial<AdvWeek> = {
      week_number,
      week_label: body.week_label || null,
      week_start,
      week_end,
      notes: body.notes || null,
      acq_spesa: Number(body.acq_spesa) || 0,
      acq_impression: Number(body.acq_impression) || 0,
      acq_click: Number(body.acq_click) || 0,
      acq_acquisti: Number(body.acq_acquisti) || 0,
      acq_revenue: Number(body.acq_revenue) || 0,
      ret_spesa: Number(body.ret_spesa) || 0,
      ret_impression: Number(body.ret_impression) || 0,
      ret_click: Number(body.ret_click) || 0,
      ret_acquisti: Number(body.ret_acquisti) || 0,
      ret_revenue: Number(body.ret_revenue) || 0,
      tra_spesa: Number(body.tra_spesa) || 0,
      tra_impression: Number(body.tra_impression) || 0,
      tra_click: Number(body.tra_click) || 0
    };

    const { data, error } = await supabase
      .from("adv_weeks")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, week: data });
  } catch (err: any) {
    console.error("[/api/adv] POST error:", err);
    if (err.code === "23505") {
      return NextResponse.json(
        { ok: false, error: "Una settimana con questo numero esiste già. Cambia il numero o modifica quella esistente." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/adv?id=<uuid>
 * Body: partial AdvWeek fields to update
 */
export async function PATCH(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

    const body = await req.json();
    const supabase = getAdminClient();

    const allowed: (keyof AdvWeek)[] = [
      "week_number", "week_label", "week_start", "week_end", "notes",
      "acq_spesa", "acq_impression", "acq_click", "acq_acquisti", "acq_revenue",
      "ret_spesa", "ret_impression", "ret_click", "ret_acquisti", "ret_revenue",
      "tra_spesa", "tra_impression", "tra_click"
    ];

    const updateData: any = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) {
        if (key.startsWith("acq_") || key.startsWith("ret_") || key.startsWith("tra_") || key === "week_number") {
          updateData[key] = Number(body[key]) || 0;
        } else {
          updateData[key] = body[key];
        }
      }
    }

    const { data, error } = await supabase
      .from("adv_weeks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, week: data });
  } catch (err: any) {
    console.error("[/api/adv] PATCH error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/adv?id=<uuid>
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

    const supabase = getAdminClient();
    const { error } = await supabase.from("adv_weeks").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[/api/adv] DELETE error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
