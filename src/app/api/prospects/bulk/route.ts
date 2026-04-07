import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/utils/rate-limiter";

/**
 * POST /api/prospects/bulk
 * Bulk operations on prospects: update status, add/remove tags, delete, enroll in sequence
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
    const { action, prospect_ids, data } = (await request.json()) as {
      action: string;
      prospect_ids: string[];
      data?: Record<string, unknown>;
    };

    if (!prospect_ids?.length) {
      return NextResponse.json({ error: "prospect_ids array is required" }, { status: 400 });
    }

    if (prospect_ids.length > 500) {
      return NextResponse.json({ error: "Max 500 prospects per bulk operation" }, { status: 400 });
    }

    switch (action) {
      case "update_status": {
        const status = data?.status as string;
        if (!status) {
          return NextResponse.json({ error: "status is required" }, { status: 400 });
        }

        const validStatuses = ["new", "researched", "contacted", "replied", "qualified", "converted", "lost", "opted_out", "bounced"];
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ error: `Invalid status. Valid: ${validStatuses.join(", ")}` }, { status: 400 });
        }

        const { error, count } = await supabase
          .from("prospects")
          .update({ status, updated_at: new Date().toISOString() })
          .in("id", prospect_ids)
          .eq("user_id", user.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, action, updated: count });
      }

      case "add_tags": {
        const tags = data?.tags as string[];
        if (!tags?.length) {
          return NextResponse.json({ error: "tags array is required" }, { status: 400 });
        }

        // Get current tags for each prospect, then merge
        const { data: prospects, error: fetchError } = await supabase
          .from("prospects")
          .select("id, tags")
          .in("id", prospect_ids)
          .eq("user_id", user.id);

        if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

        let updated = 0;
        for (const prospect of prospects || []) {
          const currentTags = (prospect.tags as string[]) || [];
          const mergedTags = [...new Set([...currentTags, ...tags])];

          await supabase
            .from("prospects")
            .update({ tags: mergedTags, updated_at: new Date().toISOString() })
            .eq("id", prospect.id);
          updated++;
        }

        return NextResponse.json({ success: true, action, updated });
      }

      case "remove_tags": {
        const tags = data?.tags as string[];
        if (!tags?.length) {
          return NextResponse.json({ error: "tags array is required" }, { status: 400 });
        }

        const { data: prospects, error: fetchError } = await supabase
          .from("prospects")
          .select("id, tags")
          .in("id", prospect_ids)
          .eq("user_id", user.id);

        if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

        let updated = 0;
        for (const prospect of prospects || []) {
          const currentTags = (prospect.tags as string[]) || [];
          const filteredTags = currentTags.filter((t) => !tags.includes(t));

          await supabase
            .from("prospects")
            .update({ tags: filteredTags, updated_at: new Date().toISOString() })
            .eq("id", prospect.id);
          updated++;
        }

        return NextResponse.json({ success: true, action, updated });
      }

      case "delete": {
        const { error, count } = await supabase
          .from("prospects")
          .delete()
          .in("id", prospect_ids)
          .eq("user_id", user.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, action, deleted: count });
      }

      case "enroll_sequence": {
        const sequenceId = data?.sequence_id as string;
        if (!sequenceId) {
          return NextResponse.json({ error: "sequence_id is required" }, { status: 400 });
        }

        // Verify sequence belongs to user
        const { data: seq } = await supabase
          .from("sequences")
          .select("id")
          .eq("id", sequenceId)
          .eq("user_id", user.id)
          .single();

        if (!seq) {
          return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
        }

        // Bulk enroll — skip already enrolled
        const enrollments = prospect_ids.map((pid) => ({
          prospect_id: pid,
          sequence_id: sequenceId,
          user_id: user.id,
          current_step: 1,
          status: "active",
        }));

        const { error } = await supabase
          .from("sequence_enrollments")
          .upsert(enrollments, { onConflict: "prospect_id,sequence_id", ignoreDuplicates: true });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, action, enrolled: prospect_ids.length });
      }

      case "export": {
        const { data: prospects, error } = await supabase
          .from("prospects")
          .select("*")
          .in("id", prospect_ids)
          .eq("user_id", user.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Return CSV-ready data
        return NextResponse.json({
          success: true,
          action,
          count: prospects?.length || 0,
          prospects,
        });
      }

      default:
        return NextResponse.json({
          error: `Unknown action: ${action}`,
          available: ["update_status", "add_tags", "remove_tags", "delete", "enroll_sequence", "export"],
        }, { status: 400 });
    }
  } catch (err) {
    console.error("[Bulk prospects] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
