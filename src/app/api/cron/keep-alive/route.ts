import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron Job: Supabase Keep-Alive
 * Schedule: Every 2 days
 * Pings the Supabase database with a lightweight query to prevent
 * the free-tier project from pausing due to inactivity.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Lightweight query — just check if we can reach the DB
    const { data, error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("[Keep-Alive] Supabase ping failed:", error.message);
      return NextResponse.json(
        { error: "Ping failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "alive",
      project: "pitchmint",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Keep-Alive] Unexpected error:", err);
    return NextResponse.json(
      { error: "Keep-alive failed" },
      { status: 500 }
    );
  }
}
