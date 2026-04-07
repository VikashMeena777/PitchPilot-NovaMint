import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkDeliverability } from "@/lib/email/deliverability";

/**
 * POST /api/emails/check
 * Pre-send deliverability check for email content
 *
 * Body: { subject: string, body: string, from_email?: string }
 * Returns deliverability score, grade, and issues
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

  try {
    const { subject, body, from_email } = (await request.json()) as {
      subject: string;
      body: string;
      from_email?: string;
    };

    if (!subject && !body) {
      return NextResponse.json(
        { error: "At least subject or body is required" },
        { status: 400 }
      );
    }

    const result = checkDeliverability({
      subject: subject || "",
      body: body || "",
      fromEmail: from_email,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Deliverability Check] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
