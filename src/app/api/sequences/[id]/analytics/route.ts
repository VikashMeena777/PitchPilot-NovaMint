import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/sequences/[id]/analytics
 * Returns detailed analytics for a specific sequence
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  try {
    // Verify sequence ownership
    const { data: sequence } = await supabase
      .from("sequences")
      .select("id, name, status, total_steps, created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!sequence) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    // Get enrollment stats
    const { data: enrollments } = await supabase
      .from("sequence_enrollments")
      .select("id, status, current_step, created_at, stopped_at, completed_at, stopped_reason")
      .eq("sequence_id", id);

    const allEnrollments = enrollments || [];

    const enrollmentStats = {
      total: allEnrollments.length,
      active: allEnrollments.filter((e) => e.status === "active").length,
      completed: allEnrollments.filter((e) => e.status === "completed").length,
      stopped: allEnrollments.filter((e) => e.status === "stopped").length,
      paused: allEnrollments.filter((e) => e.status === "paused").length,
    };

    // Get email performance for this sequence
    const { data: emails } = await supabase
      .from("emails")
      .select("id, status, opened_at, clicked_at, has_reply, reply_category, bounce_type, created_at")
      .eq("sequence_id", id)
      .eq("user_id", user.id);

    const allEmails = emails || [];

    const emailStats = {
      total_sent: allEmails.filter((e) => e.status === "sent" || e.status === "delivered").length,
      delivered: allEmails.filter((e) => e.status === "delivered").length,
      opened: allEmails.filter((e) => e.opened_at).length,
      clicked: allEmails.filter((e) => e.clicked_at).length,
      replied: allEmails.filter((e) => e.has_reply).length,
      bounced: allEmails.filter((e) => e.bounce_type).length,
    };

    // Calculate rates
    const sent = emailStats.total_sent || 1;
    const rates = {
      open_rate: Math.round((emailStats.opened / sent) * 100 * 10) / 10,
      click_rate: Math.round((emailStats.clicked / sent) * 100 * 10) / 10,
      reply_rate: Math.round((emailStats.replied / sent) * 100 * 10) / 10,
      bounce_rate: Math.round((emailStats.bounced / sent) * 100 * 10) / 10,
      delivery_rate: Math.round((emailStats.delivered / sent) * 100 * 10) / 10,
    };

    // Per-step breakdown
    const stepsMap = new Map<number, {
      sent: number;
      opened: number;
      clicked: number;
      replied: number;
      bounced: number;
    }>();

    for (const email of allEmails) {
      const step = (email as any).step_number || 1;
      if (!stepsMap.has(step)) {
        stepsMap.set(step, { sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 });
      }
      const s = stepsMap.get(step)!;
      s.sent++;
      if (email.opened_at) s.opened++;
      if (email.clicked_at) s.clicked++;
      if (email.has_reply) s.replied++;
      if (email.bounce_type) s.bounced++;
    }

    const stepBreakdown = Array.from(stepsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([step, data]) => ({
        step,
        ...data,
        open_rate: data.sent > 0 ? Math.round((data.opened / data.sent) * 100) : 0,
        click_rate: data.sent > 0 ? Math.round((data.clicked / data.sent) * 100) : 0,
        reply_rate: data.sent > 0 ? Math.round((data.replied / data.sent) * 100) : 0,
      }));

    // Reply categories breakdown
    const replyCats = allEmails
      .filter((e) => e.reply_category)
      .reduce<Record<string, number>>((acc, e) => {
        acc[e.reply_category!] = (acc[e.reply_category!] || 0) + 1;
        return acc;
      }, {});

    // Stop reasons breakdown
    const stopReasons = allEnrollments
      .filter((e) => e.stopped_reason)
      .reduce<Record<string, number>>((acc, e) => {
        acc[e.stopped_reason!] = (acc[e.stopped_reason!] || 0) + 1;
        return acc;
      }, {});

    // Daily send volume (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentEmails = allEmails.filter((e) => e.created_at >= thirtyDaysAgo);

    const dailyVolume = recentEmails.reduce<Record<string, number>>((acc, e) => {
      const day = e.created_at.split("T")[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      sequence: {
        id: sequence.id,
        name: sequence.name,
        status: sequence.status,
        total_steps: sequence.total_steps,
        created_at: sequence.created_at,
      },
      enrollments: enrollmentStats,
      emails: emailStats,
      rates,
      step_breakdown: stepBreakdown,
      reply_categories: replyCats,
      stop_reasons: stopReasons,
      daily_volume: dailyVolume,
    });
  } catch (err) {
    console.error("[Sequence Analytics] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
