import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/utils/rate-limiter";
import { logActivity } from "@/lib/utils/activity-logger";

/**
 * POST /api/prospects/import
 * Import prospects from CSV data
 *
 * Body: { prospects: Array<{ email, first_name?, last_name?, company_name?, job_title?, linkedin_url?, phone?, tags?, notes? }> }
 * Returns: { imported, skipped, errors }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const rl = withRateLimit(user.id, "api_request");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: rl.headers });
  }

  try {
    const { prospects } = (await request.json()) as {
      prospects: Array<{
        email: string;
        first_name?: string;
        last_name?: string;
        company_name?: string;
        job_title?: string;
        linkedin_url?: string;
        phone?: string;
        tags?: string[];
        notes?: string;
        status?: string;
        source?: string;
      }>;
    };

    if (!prospects?.length) {
      return NextResponse.json({ error: "prospects array is required" }, { status: 400 });
    }

    if (prospects.length > 5000) {
      return NextResponse.json({ error: "Max 5000 prospects per import" }, { status: 400 });
    }

    // Check plan limits
    const { count: existingCount } = await supabase
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { data: profile } = await supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .single();

    const planLimits: Record<string, number> = {
      free: 100,
      starter: 1000,
      growth: 5000,
      agency: 25000,
    };

    const maxProspects = planLimits[profile?.plan || "free"] || 100;
    const currentCount = existingCount || 0;
    const available = maxProspects - currentCount;

    if (available <= 0) {
      return NextResponse.json({
        error: `Prospect limit reached (${maxProspects}). Upgrade your plan.`,
        limit: maxProspects,
        current: currentCount,
      }, { status: 403 });
    }

    // Validate and deduplicate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seen = new Set<string>();
    const validProspects: typeof prospects = [];
    const errors: Array<{ row: number; email: string; reason: string }> = [];

    for (let i = 0; i < prospects.length; i++) {
      const p = prospects[i];

      if (!p.email) {
        errors.push({ row: i + 1, email: "", reason: "Missing email" });
        continue;
      }

      const email = p.email.toLowerCase().trim();

      if (!emailRegex.test(email)) {
        errors.push({ row: i + 1, email, reason: "Invalid email format" });
        continue;
      }

      if (seen.has(email)) {
        errors.push({ row: i + 1, email, reason: "Duplicate in import" });
        continue;
      }

      seen.add(email);

      if (validProspects.length >= available) {
        errors.push({ row: i + 1, email, reason: "Plan limit reached" });
        continue;
      }

      validProspects.push({ ...p, email });
    }

    if (validProspects.length === 0) {
      return NextResponse.json({
        success: false,
        imported: 0,
        skipped: errors.length,
        errors: errors.slice(0, 20),
      });
    }

    // Batch upsert (on conflict: user_id + email)
    const rows = validProspects.map((p) => ({
      user_id: user.id,
      email: p.email,
      first_name: p.first_name?.trim() || null,
      last_name: p.last_name?.trim() || null,
      company_name: p.company_name?.trim() || null,
      job_title: p.job_title?.trim() || null,
      linkedin_url: p.linkedin_url?.trim() || null,
      phone: p.phone?.trim() || null,
      tags: p.tags || [],
      notes: p.notes?.trim() || null,
      status: p.status || "new",
      source: p.source || "csv_import",
    }));

    // Insert in batches of 500
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { data: result, error: insertError } = await supabase
        .from("prospects")
        .upsert(batch, { onConflict: "user_id,email", ignoreDuplicates: false })
        .select("id");

      if (insertError) {
        errors.push({ row: i, email: "batch", reason: insertError.message });
        skipped += batch.length;
      } else {
        imported += result?.length || batch.length;
      }
    }

    // Log activity
    logActivity({
      user_id: user.id,
      action: "prospect.imported",
      metadata: { imported, skipped, errors: errors.length, total: prospects.length },
    });

    return NextResponse.json({
      success: true,
      imported,
      skipped: skipped + errors.length,
      total: prospects.length,
      errors: errors.slice(0, 20), // Return first 20 errors
      plan_usage: {
        current: currentCount + imported,
        limit: maxProspects,
      },
    });
  } catch (err) {
    console.error("[Import] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
