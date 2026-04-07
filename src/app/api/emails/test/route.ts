import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sender";
import { render } from "@react-email/components";
import { TestEmail } from "@/lib/email/templates";

/**
 * POST /api/emails/test
 * Sends a beautiful test email to verify the user's email configuration
 */
export async function POST(request: NextRequest) {
  try {
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

    const { to } = await request.json();
    const recipientEmail = to || user.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No recipient email provided" },
        { status: 400 }
      );
    }

    // Get user profile for sender info
    const { data: profile } = await supabase
      .from("users")
      .select("sending_name, sending_email, full_name, company_name")
      .eq("id", user.id)
      .single();

    const senderName =
      profile?.sending_name || profile?.full_name || "PitchPilot User";
    const defaultFrom =
      process.env.DEFAULT_FROM_EMAIL || "outreach@novamintnetworks.in";

    // Build a personalized from address
    const nameSlug = (profile?.full_name || "user")
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "");
    const domain = defaultFrom.split("@")[1] || "novamintnetworks.in";
    const fromAddress = `${nameSlug}@${domain}`;

    // Render the premium React Email template
    const htmlContent = await render(
      TestEmail({
        senderName,
        companyName: profile?.company_name || "PitchPilot",
        sendingEmail: fromAddress,
        replyTo: profile?.sending_email || user.email || "",
      })
    );

    const result = await sendEmail({
      to: recipientEmail,
      from: fromAddress,
      senderName,
      replyTo: profile?.sending_email || user.email || undefined,
      subject: "✅ PitchPilot — Your Email Setup is Working!",
      body: `Test email from PitchPilot — your configuration is working correctly.`,
      bodyHtml: htmlContent,
      trackOpens: true,
      trackClicks: false,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: "Test email sent successfully",
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send test email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Test Email] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send test email",
      },
      { status: 500 }
    );
  }
}
