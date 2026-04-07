import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GDPR Data Deletion Endpoint
 * Allows users to request complete deletion of their data
 * POST /api/user/delete-data
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Service not configured" },
      { status: 500 }
    );
  }

  // Get the user's auth token from the request
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify the user's JWT
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const userId = user.id;

  try {
    // Order matters due to foreign key constraints
    // 1. Delete all emails
    await supabase.from("emails").delete().eq("user_id", userId);

    // 2. Delete sequence enrollments
    await supabase
      .from("sequence_enrollments")
      .delete()
      .eq("user_id", userId);

    // 3. Delete sequence steps (via sequences)
    const { data: sequences } = await supabase
      .from("sequences")
      .select("id")
      .eq("user_id", userId);

    if (sequences && sequences.length > 0) {
      const sequenceIds = sequences.map((s) => s.id);
      await supabase
        .from("sequence_steps")
        .delete()
        .in("sequence_id", sequenceIds);
    }

    // 4. Delete sequences
    await supabase.from("sequences").delete().eq("user_id", userId);

    // 5. Delete prospects
    await supabase.from("prospects").delete().eq("user_id", userId);

    // 6. Delete CSV uploads
    await supabase.from("csv_uploads").delete().eq("user_id", userId);

    // 7. Delete analytics
    await supabase.from("analytics_daily").delete().eq("user_id", userId);

    // 8. Delete billing events
    await supabase.from("billing_events").delete().eq("user_id", userId);

    // 9. Delete user profile
    await supabase.from("users").delete().eq("id", userId);

    // 10. Delete auth user (permanently removes from Supabase Auth)
    await supabase.auth.admin.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message:
        "All your data has been permanently deleted. Your account no longer exists.",
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GDPR] Data deletion failed for user:", userId, error);
    return NextResponse.json(
      {
        error:
          "Data deletion partially failed. Please contact support for complete removal.",
      },
      { status: 500 }
    );
  }
}
