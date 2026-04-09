import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sender";
import { sendViaGmail } from "@/lib/email/gmail";
import { render } from "@react-email/components";
import { TestEmail } from "@/lib/email/templates";

/**
 * POST /api/emails/test
 * Sends a test email to verify the user's email configuration.
 *
 * Sender strategy:
 *  1. Gmail API — if user has gmail_connected
 *  2. Resend — fallback
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

    // Get user profile — include Gmail fields
    const { data: profile } = await supabase
      .from("users")
      .select("sending_name, sending_email, full_name, company_name, gmail_connected, gmail_email")
      .eq("id", user.id)
      .single();

    const senderName =
      profile?.sending_name || profile?.full_name || "PitchMint User";

    // ─── Strategy 1: Gmail (primary when connected) ──────────────
    if (profile?.gmail_connected && profile?.gmail_email) {
      // Render email template with Gmail context
      const htmlContent = await render(
        TestEmail({
          senderName,
          companyName: profile?.company_name || "PitchMint",
          sendingEmail: profile.gmail_email,
          replyTo: profile?.sending_email || user.email || "",
        })
      );

      const gmailResult = await sendViaGmail(user.id, {
        to: recipientEmail,
        subject: "✅ PitchMint — Your Gmail Setup is Working!",
        body: `Test email from PitchMint — your Gmail integration is working correctly.`,
        bodyHtml: htmlContent,
        senderName,
      });

      if (gmailResult.success) {
        return NextResponse.json({
          success: true,
          messageId: gmailResult.messageId,
          message: "Test email sent via your Gmail account!",
          via: "gmail",
        });
      }

      // Gmail failed — fall through to Resend
      console.warn(`[Test Email] Gmail failed, falling back to Resend: ${gmailResult.error}`);
    }

    // ─── Strategy 2: Resend (fallback / default) ─────────────────
    const defaultFrom =
      process.env.DEFAULT_FROM_EMAIL || "outreach@novamintnetworks.in";

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
        companyName: profile?.company_name || "PitchMint",
        sendingEmail: fromAddress,
        replyTo: profile?.sending_email || user.email || "",
      })
    );

    const result = await sendEmail({
      to: recipientEmail,
      from: fromAddress,
      senderName,
      replyTo: profile?.sending_email || user.email || undefined,
      subject: "✅ PitchMint — Your Email Setup is Working!",
      body: `Test email from PitchMint — your configuration is working correctly.`,
      bodyHtml: htmlContent,
      trackOpens: true,
      trackClicks: false,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: "Test email sent successfully",
        via: "resend",
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
