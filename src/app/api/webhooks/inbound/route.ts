import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withRateLimit } from "@/lib/utils/rate-limiter";

// Inbound webhook endpoint for external integrations
// Supports: add_prospect, update_status, enroll_sequence
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing X-API-Key header" },
        { status: 401 }
      );
    }

    // Rate limit: 60 requests/minute per API key
    const rateLimit = withRateLimit(apiKey, "webhook_call");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429, headers: rateLimit.headers }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API key and get user
    const { data: user } = await supabase
      .from("users")
      .select("id, api_key")
      .eq("api_key", apiKey)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "add_prospect": {
        if (!data?.email) {
          return NextResponse.json(
            { error: "Email is required" },
            { status: 400 }
          );
        }

        const { data: prospect, error } = await supabase
          .from("prospects")
          .upsert(
            {
              user_id: user.id,
              email: data.email.toLowerCase().trim(),
              first_name: data.first_name || null,
              last_name: data.last_name || null,
              company_name: data.company_name || null,
              job_title: data.job_title || null,
              linkedin_url: data.linkedin_url || null,
              phone: data.phone || null,
              status: data.status || "new",
              source: data.source || "api",
              tags: data.tags || [],
              notes: data.notes || null,
            },
            { onConflict: "user_id,email" }
          )
          .select("id, email")
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          action: "add_prospect",
          prospect,
        });
      }

      case "update_status": {
        if (!data?.email || !data?.status) {
          return NextResponse.json(
            { error: "Email and status are required" },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from("prospects")
          .update({
            status: data.status,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("email", data.email.toLowerCase().trim());

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          action: "update_status",
          email: data.email,
          status: data.status,
        });
      }

      case "enroll_sequence": {
        if (!data?.email || !data?.sequence_id) {
          return NextResponse.json(
            { error: "Email and sequence_id are required" },
            { status: 400 }
          );
        }

        // Find prospect
        const { data: prospect } = await supabase
          .from("prospects")
          .select("id")
          .eq("user_id", user.id)
          .eq("email", data.email.toLowerCase().trim())
          .single();

        if (!prospect) {
          return NextResponse.json(
            { error: "Prospect not found" },
            { status: 404 }
          );
        }

        // Check if already enrolled
        const { data: existing } = await supabase
          .from("sequence_enrollments")
          .select("id")
          .eq("prospect_id", prospect.id)
          .eq("sequence_id", data.sequence_id)
          .single();

        if (existing) {
          return NextResponse.json(
            { error: "Prospect already enrolled in this sequence" },
            { status: 409 }
          );
        }

        const { error } = await supabase
          .from("sequence_enrollments")
          .insert({
            prospect_id: prospect.id,
            sequence_id: data.sequence_id,
            user_id: user.id,
            current_step: 1,
            status: "active",
          });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          action: "enroll_sequence",
          prospect_id: prospect.id,
          sequence_id: data.sequence_id,
        });
      }

      case "list_sequences": {
        const { data: sequences } = await supabase
          .from("sequences")
          .select("id, name, status, total_steps, enrolled_count")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        return NextResponse.json({
          success: true,
          sequences: sequences || [],
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action: ${action}`,
            available_actions: [
              "add_prospect",
              "update_status",
              "enroll_sequence",
              "list_sequences",
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook health check
export async function GET() {
  return NextResponse.json({
    service: "PitchPilot Webhook API",
    version: "1.0",
    available_actions: [
      "add_prospect",
      "update_status",
      "enroll_sequence",
      "list_sequences",
    ],
    docs: "POST with { action, data } body and X-API-Key header",
  });
}
