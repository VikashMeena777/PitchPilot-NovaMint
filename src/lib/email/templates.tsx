import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

/* ────────────────────────────────────────────
   Shared Design Tokens
   ──────────────────────────────────────────── */
const palette = {
  bgPage: "#0f0f17",
  bgCard: "#16161f",
  bgCardAlt: "#1c1c2b",
  border: "#2a2a3d",
  accent: "#7c5cfc",
  accentSoft: "rgba(124,92,252,0.12)",
  text: "#e8e8ef",
  textSecondary: "#9898ad",
  textMuted: "#6b6b80",
  white: "#ffffff",
  success: "#34d399",
};

const font =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/* ────────────────────────────────────────────
   1. Outreach Email Template
   ──────────────────────────────────────────── */
export type OutreachEmailProps = {
  recipientName: string;
  senderName: string;
  companyName: string;
  subject: string;
  bodyHtml: string; // AI-generated body (already HTML formatted)
  sendingEmail?: string;
  mailingAddress?: string;
  unsubscribeUrl?: string;
};

export function OutreachEmail({
  recipientName = "there",
  senderName = "Alex",
  companyName = "",
  bodyHtml = "",
  sendingEmail = "",
  mailingAddress = "",
  unsubscribeUrl = "#",
}: OutreachEmailProps) {
  return (
    <Html>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            .container { padding: 16px !important; }
            .body-text { font-size: 15px !important; line-height: 1.7 !important; }
          }
        `}</style>
      </Head>
      <Preview>
        {`Hi ${recipientName}, ${senderName}${companyName ? ` from ${companyName}` : ""} here`}
      </Preview>
      <Body style={{ backgroundColor: "#ffffff", margin: 0, padding: 0, fontFamily: font }}>
        <Container className="container" style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 24px" }}>
          {/* Body Content — clean, personal, no heavy branding */}
          <Section>
            <div
              className="body-text"
              style={{
                fontSize: "16px",
                lineHeight: "1.75",
                color: "#1a1a2e",
                whiteSpace: "pre-wrap",
              }}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </Section>

          {/* Subtle Signature */}
          <Section style={{ marginTop: "32px" }}>
            <Text style={{ fontSize: "15px", color: "#1a1a2e", margin: 0, lineHeight: "1.6" }}>
              Best,
              <br />
              <strong>{senderName}</strong>
              {companyName && (
                <>
                  <br />
                  <span style={{ color: "#64748b", fontSize: "14px" }}>{companyName}</span>
                </>
              )}
            </Text>
            {sendingEmail && (
              <Text style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0" }}>
                {sendingEmail}
              </Text>
            )}
          </Section>

          {/* CAN-SPAM Footer */}
          <Hr style={{ borderColor: "#e2e8f0", margin: "32px 0 16px" }} />
          <Text style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.5", margin: 0 }}>
            {"You're receiving this because we thought our solution might be relevant to you. "}
            <Link href={unsubscribeUrl} style={{ color: "#7c5cfc", textDecoration: "underline" }}>
              Unsubscribe
            </Link>
            {" or reply \"stop\" to opt out."}
            {mailingAddress && (
              <>
                <br />
                {mailingAddress}
              </>
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/* ────────────────────────────────────────────
   2. Test Email Template
   ──────────────────────────────────────────── */
export type TestEmailProps = {
  senderName: string;
  companyName?: string;
  sendingEmail?: string;
  replyTo?: string;
};

export function TestEmail({
  senderName = "User",
  companyName = "PitchPilot",
  sendingEmail = "",
  replyTo = "",
}: TestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>✅ Your PitchPilot email setup is working!</Preview>
      <Body style={{ backgroundColor: palette.bgPage, margin: 0, padding: 0, fontFamily: font }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 20px" }}>
          {/* Header with gradient accent */}
          <Section
            style={{
              backgroundColor: palette.bgCard,
              borderRadius: "16px",
              border: `1px solid ${palette.border}`,
              overflow: "hidden",
            }}
          >
            {/* Top accent bar */}
            <div
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #7c5cfc 0%, #a78bfa 50%, #818cf8 100%)",
              }}
            />

            {/* Content */}
            <div style={{ padding: "32px 28px" }}>
              {/* Success icon */}
              <div style={{ textAlign: "center" as const, marginBottom: "24px" }}>
                <div
                  style={{
                    display: "inline-block",
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(52, 211, 153, 0.15)",
                    lineHeight: "56px",
                    fontSize: "28px",
                    textAlign: "center" as const,
                  }}
                >
                  ✅
                </div>
              </div>

              <Heading
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: palette.white,
                  textAlign: "center" as const,
                  margin: "0 0 8px",
                  letterSpacing: "-0.3px",
                }}
              >
                Setup Complete!
              </Heading>
              <Text
                style={{
                  fontSize: "14px",
                  color: palette.textSecondary,
                  textAlign: "center" as const,
                  margin: "0 0 28px",
                }}
              >
                Your email configuration is working perfectly.
              </Text>

              <Hr style={{ borderColor: palette.border, margin: "0 0 24px" }} />

              {/* Config summary */}
              <Section>
                <Row style={{ marginBottom: "12px" }}>
                  <Column style={{ width: "140px" }}>
                    <Text style={{ fontSize: "12px", color: palette.textMuted, margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                      Sender Name
                    </Text>
                  </Column>
                  <Column>
                    <Text style={{ fontSize: "14px", color: palette.text, margin: 0 }}>
                      {senderName}
                    </Text>
                  </Column>
                </Row>
                <Row style={{ marginBottom: "12px" }}>
                  <Column style={{ width: "140px" }}>
                    <Text style={{ fontSize: "12px", color: palette.textMuted, margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                      Company
                    </Text>
                  </Column>
                  <Column>
                    <Text style={{ fontSize: "14px", color: palette.text, margin: 0 }}>
                      {companyName || "—"}
                    </Text>
                  </Column>
                </Row>
                {sendingEmail && (
                  <Row style={{ marginBottom: "12px" }}>
                    <Column style={{ width: "140px" }}>
                      <Text style={{ fontSize: "12px", color: palette.textMuted, margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                        From Email
                      </Text>
                    </Column>
                    <Column>
                      <Text style={{ fontSize: "14px", color: palette.text, margin: 0 }}>
                        {sendingEmail}
                      </Text>
                    </Column>
                  </Row>
                )}
                {replyTo && (
                  <Row style={{ marginBottom: "12px" }}>
                    <Column style={{ width: "140px" }}>
                      <Text style={{ fontSize: "12px", color: palette.textMuted, margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                        Reply-To
                      </Text>
                    </Column>
                    <Column>
                      <Text style={{ fontSize: "14px", color: palette.text, margin: 0 }}>
                        {replyTo}
                      </Text>
                    </Column>
                  </Row>
                )}
              </Section>

              <Hr style={{ borderColor: palette.border, margin: "24px 0" }} />

              {/* Checks */}
              <Section>
                {[
                  "Email sending operational",
                  "Open tracking pixel embedded",
                  "CAN-SPAM compliant footer",
                  "Unsubscribe mechanism active",
                ].map((check, i) => (
                  <Text key={i} style={{ fontSize: "13px", color: palette.success, margin: "0 0 6px", lineHeight: "1.5" }}>
                    ✓ {check}
                  </Text>
                ))}
              </Section>
            </div>
          </Section>

          {/* Footer */}
          <Text
            style={{
              fontSize: "11px",
              color: palette.textMuted,
              textAlign: "center" as const,
              marginTop: "24px",
              lineHeight: "1.6",
            }}
          >
            Sent by{" "}
            <Link href="https://pitchpilot.novamintnetworks.in" style={{ color: palette.accent }}>
              PitchPilot
            </Link>{" "}
            · AI-Powered Cold Outreach Platform
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
