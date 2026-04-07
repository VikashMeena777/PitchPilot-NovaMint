import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/emails/health
 * Email sending health dashboard — deliverability metrics, bounce rates, warm-up progress
 */
export async function GET(_request: NextRequest) {
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
    // Get user profile for warm-up status
    const { data: profile } = await supabase
      .from("users")
      .select("warmup_started_at, warmup_completed, daily_send_limit, sending_email, gmail_connected, gmail_email")
      .eq("id", user.id)
      .single();

    // Get email stats for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentEmails } = await supabase
      .from("emails")
      .select("id, status, opened_at, clicked_at, has_reply, bounce_type, created_at")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo);

    const emails = recentEmails || [];

    // Calculate metrics
    const totalSent = emails.filter((e) => ["sent", "delivered"].includes(e.status)).length;
    const delivered = emails.filter((e) => e.status === "delivered").length;
    const opened = emails.filter((e) => e.opened_at).length;
    const clicked = emails.filter((e) => e.clicked_at).length;
    const replied = emails.filter((e) => e.has_reply).length;
    const hardBounces = emails.filter((e) => e.bounce_type === "hard").length;
    const softBounces = emails.filter((e) => e.bounce_type === "soft").length;
    const totalBounces = hardBounces + softBounces;

    const sent = totalSent || 1; // avoid division by zero

    // Daily send volume (last 14 days)
    const dailyData: Record<string, { sent: number; opened: number; bounced: number }> = {};
    for (let i = 0; i < 14; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      dailyData[date] = { sent: 0, opened: 0, bounced: 0 };
    }

    for (const email of emails) {
      const day = email.created_at.split("T")[0];
      if (dailyData[day]) {
        dailyData[day].sent++;
        if (email.opened_at) dailyData[day].opened++;
        if (email.bounce_type) dailyData[day].bounced++;
      }
    }

    // Warm-up progress
    let warmupProgress = 100;
    let warmupDay = 0;
    if (profile?.warmup_started_at && !profile.warmup_completed) {
      const startDate = new Date(profile.warmup_started_at);
      warmupDay = Math.floor(
        (Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      warmupProgress = Math.min(100, Math.round((warmupDay / 15) * 100));
    }

    // Health score (composite)
    let healthScore = 100;
    const healthIssues: Array<{ severity: string; message: string }> = [];

    // Bounce rate check
    const bounceRate = (totalBounces / sent) * 100;
    if (bounceRate > 5) {
      healthScore -= 30;
      healthIssues.push({
        severity: "critical",
        message: `Bounce rate ${bounceRate.toFixed(1)}% exceeds 5% threshold. Clean your list.`,
      });
    } else if (bounceRate > 2) {
      healthScore -= 10;
      healthIssues.push({
        severity: "warning",
        message: `Bounce rate ${bounceRate.toFixed(1)}% is elevated. Monitor closely.`,
      });
    }

    // Open rate check
    const openRate = (opened / sent) * 100;
    if (totalSent > 20 && openRate < 15) {
      healthScore -= 15;
      healthIssues.push({
        severity: "warning",
        message: `Open rate ${openRate.toFixed(1)}% is below average. Improve subject lines.`,
      });
    }

    // Spam complaint proxy (high bounces + low opens)
    if (bounceRate > 3 && openRate < 10 && totalSent > 50) {
      healthScore -= 20;
      healthIssues.push({
        severity: "critical",
        message: "Low opens + high bounces suggest deliverability issues. Pause and investigate.",
      });
    }

    // Sending configuration check
    if (!profile?.sending_email) {
      healthScore -= 10;
      healthIssues.push({
        severity: "info",
        message: "No sending email configured. Set up in Settings.",
      });
    }

    healthScore = Math.max(0, healthScore);

    return NextResponse.json({
      health_score: healthScore,
      health_grade:
        healthScore >= 90 ? "Excellent" :
        healthScore >= 75 ? "Good" :
        healthScore >= 50 ? "Needs Attention" : "Critical",
      health_issues: healthIssues,
      metrics: {
        total_sent: totalSent,
        delivered,
        opened,
        clicked,
        replied,
        hard_bounces: hardBounces,
        soft_bounces: softBounces,
      },
      rates: {
        delivery_rate: Math.round((delivered / sent) * 1000) / 10,
        open_rate: Math.round((opened / sent) * 1000) / 10,
        click_rate: Math.round((clicked / sent) * 1000) / 10,
        reply_rate: Math.round((replied / sent) * 1000) / 10,
        bounce_rate: Math.round(bounceRate * 10) / 10,
      },
      warmup: {
        active: !!profile?.warmup_started_at && !profile?.warmup_completed,
        day: warmupDay,
        progress: warmupProgress,
        daily_limit: profile?.daily_send_limit || 50,
      },
      sending: {
        email: profile?.sending_email || null,
        gmail_connected: profile?.gmail_connected || false,
        gmail_email: profile?.gmail_email || null,
      },
      daily_volume: Object.entries(dailyData)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (err) {
    console.error("[Email Health] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
