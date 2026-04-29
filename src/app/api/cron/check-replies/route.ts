import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkGmailReplies } from "@/lib/email/gmail";

/**
 * Cron Job: Check Gmail for Replies
 * Schedule: Every 5 minutes
 * Polls Gmail inbox for each user with gmail_connected = true
 * to detect replies to outreach emails using the gmail.readonly scope.
 *
 * This sets has_reply = true on emails that have received a reply,
 * which then triggers the process-replies cron to categorize them.
 */
async function handleCheckReplies(request: NextRequest) {
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

  // Get all users with Gmail connected
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, gmail_email")
    .eq("gmail_connected", true)
    .not("gmail_refresh_token", "is", null);

  if (usersError || !users || users.length === 0) {
    return NextResponse.json({
      message: "No users with Gmail connected",
      usersChecked: 0,
      totalRepliesFound: 0,
      timestamp: new Date().toISOString(),
    });
  }

  let totalReplies = 0;
  let totalErrors = 0;
  const userResults: { userId: string; email: string; found: number; errors: number }[] = [];

  for (const user of users) {
    try {
      const result = await checkGmailReplies(user.id);
      totalReplies += result.found;
      totalErrors += result.errors;
      userResults.push({
        userId: user.id,
        email: user.gmail_email || user.email,
        found: result.found,
        errors: result.errors,
      });

      if (result.found > 0) {
        console.log(
          `[Check-Replies] Found ${result.found} replies for user ${user.gmail_email || user.email}`
        );
      }
    } catch (err) {
      totalErrors++;
      console.error(
        `[Check-Replies] Error checking replies for user ${user.id}:`,
        err
      );
    }
  }

  return NextResponse.json({
    usersChecked: users.length,
    totalRepliesFound: totalReplies,
    totalErrors,
    userResults,
    timestamp: new Date().toISOString(),
  });
}

// POST: GitHub Actions cron
export async function POST(request: NextRequest) {
  return handleCheckReplies(request);
}

// GET: Vercel cron
export async function GET(request: NextRequest) {
  return handleCheckReplies(request);
}

