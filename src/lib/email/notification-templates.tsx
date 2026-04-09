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
  warning: "#fbbf24",
  danger: "#f87171",
};

const font =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pitchpilot.novamintnetworks.in";

/* ────────────────────────────────────────────
   1. Reply Notification Email
   ──────────────────────────────────────────── */
export type ReplyNotificationProps = {
  userName: string;
  prospectName: string;
  prospectEmail: string;
  replyCategory: string;
  replySnippet: string;
  subject: string;
};

export function ReplyNotificationEmail({
  userName = "User",
  prospectName = "John Doe",
  prospectEmail = "john@example.com",
  replyCategory = "interested",
  replySnippet = "",
  subject = "Re: Your email",
}: ReplyNotificationProps) {
  const categoryLabels: Record<string, { label: string; color: string; emoji: string }> = {
    interested: { label: "Interested", color: palette.success, emoji: "🎯" },
    not_interested: { label: "Not Interested", color: palette.danger, emoji: "👎" },
    ooo: { label: "Out of Office", color: palette.warning, emoji: "🏖️" },
    unsubscribe: { label: "Unsubscribe", color: palette.danger, emoji: "🚫" },
    wrong_person: { label: "Wrong Person", color: palette.warning, emoji: "🔀" },
    ask_later: { label: "Ask Later", color: palette.warning, emoji: "⏰" },
  };

  const cat = categoryLabels[replyCategory] || { label: replyCategory, color: palette.textSecondary, emoji: "💬" };

  return (
    <Html>
      <Head />
      <Preview>{`${cat.emoji} ${prospectName} replied — ${cat.label}`}</Preview>
      <Body style={{ backgroundColor: palette.bgPage, margin: 0, padding: 0, fontFamily: font }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 20px" }}>
          <Section
            style={{
              backgroundColor: palette.bgCard,
              borderRadius: "16px",
              border: `1px solid ${palette.border}`,
              overflow: "hidden",
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: "4px", background: "linear-gradient(90deg, #7c5cfc 0%, #a78bfa 50%, #818cf8 100%)" }} />

            <div style={{ padding: "32px 28px" }}>
              {/* Header */}
              <Heading style={{ fontSize: "20px", fontWeight: "700", color: palette.white, margin: "0 0 6px", letterSpacing: "-0.3px" }}>
                {cat.emoji} New Reply Received
              </Heading>
              <Text style={{ fontSize: "13px", color: palette.textSecondary, margin: "0 0 24px" }}>
                Hi {userName}, a prospect has replied to your outreach.
              </Text>

              <Hr style={{ borderColor: palette.border, margin: "0 0 20px" }} />

              {/* Reply details */}
              <Section style={{ backgroundColor: palette.bgCardAlt, borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                <Row style={{ marginBottom: "10px" }}>
                  <Column style={{ width: "100px" }}>
                    <Text style={{ fontSize: "11px", color: palette.textMuted, margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>From</Text>
                  </Column>
                  <Column>
                    <Text style={{ fontSize: "14px", color: palette.text, margin: 0, fontWeight: "600" }}>
                      {prospectName} ({prospectEmail})
                    </Text>
                  </Column>
                </Row>
                <Row style={{ marginBottom: "10px" }}>
                  <Column style={{ width: "100px" }}>
                    <Text style={{ fontSize: "11px", color: palette.textMuted, margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Subject</Text>
                  </Column>
                  <Column>
                    <Text style={{ fontSize: "14px", color: palette.text, margin: 0 }}>{subject}</Text>
                  </Column>
                </Row>
                <Row>
                  <Column style={{ width: "100px" }}>
                    <Text style={{ fontSize: "11px", color: palette.textMuted, margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Category</Text>
                  </Column>
                  <Column>
                    <Text style={{ fontSize: "14px", color: cat.color, margin: 0, fontWeight: "600" }}>
                      {cat.label}
                    </Text>
                  </Column>
                </Row>
              </Section>

              {/* Reply snippet */}
              {replySnippet && (
                <Section style={{ borderLeft: `3px solid ${palette.accent}`, paddingLeft: "16px", marginBottom: "24px" }}>
                  <Text style={{ fontSize: "13px", color: palette.textSecondary, margin: "0 0 4px", fontStyle: "italic" }}>Reply preview:</Text>
                  <Text style={{ fontSize: "14px", color: palette.text, margin: 0, lineHeight: "1.6" }}>
                    {replySnippet.slice(0, 300)}{replySnippet.length > 300 ? "..." : ""}
                  </Text>
                </Section>
              )}

              {/* CTA */}
              <Link href={`${appUrl}/prospects`} style={{
                display: "inline-block", backgroundColor: palette.accent, color: palette.white, padding: "12px 24px",
                borderRadius: "10px", fontSize: "14px", fontWeight: "600", textDecoration: "none",
              }}>
                View in Dashboard →
              </Link>
            </div>
          </Section>

          {/* Footer */}
          <Text style={{ fontSize: "11px", color: palette.textMuted, textAlign: "center" as const, marginTop: "24px", lineHeight: "1.6" }}>
            This notification was sent because you have reply alerts enabled.{" "}
            <Link href={`${appUrl}/settings`} style={{ color: palette.accent }}>Manage preferences</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/* ────────────────────────────────────────────
   2. Daily Digest Email
   ──────────────────────────────────────────── */
export type DailyDigestProps = {
  userName: string;
  date: string;
  stats: {
    emailsSent: number;
    emailsOpened: number;
    emailsReplied: number;
    emailsBounced: number;
    positiveReplies: number;
    prospectsAdded: number;
  };
  topReplies: Array<{
    prospectName: string;
    category: string;
    snippet: string;
  }>;
};

export function DailyDigestEmail({
  userName = "User",
  date = "2026-01-01",
  stats = { emailsSent: 0, emailsOpened: 0, emailsReplied: 0, emailsBounced: 0, positiveReplies: 0, prospectsAdded: 0 },
  topReplies = [],
}: DailyDigestProps) {
  const openRate = stats.emailsSent > 0 ? Math.round((stats.emailsOpened / stats.emailsSent) * 100) : 0;
  const replyRate = stats.emailsSent > 0 ? Math.round((stats.emailsReplied / stats.emailsSent) * 100) : 0;

  return (
    <Html>
      <Head />
      <Preview>{`📊 Daily Digest — ${stats.emailsSent} sent, ${openRate}% open rate, ${stats.positiveReplies} hot leads`}</Preview>
      <Body style={{ backgroundColor: palette.bgPage, margin: 0, padding: 0, fontFamily: font }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 20px" }}>
          <Section style={{ backgroundColor: palette.bgCard, borderRadius: "16px", border: `1px solid ${palette.border}`, overflow: "hidden" }}>
            <div style={{ height: "4px", background: "linear-gradient(90deg, #7c5cfc 0%, #a78bfa 50%, #818cf8 100%)" }} />

            <div style={{ padding: "32px 28px" }}>
              <Heading style={{ fontSize: "20px", fontWeight: "700", color: palette.white, margin: "0 0 6px" }}>
                📊 Daily Outreach Digest
              </Heading>
              <Text style={{ fontSize: "13px", color: palette.textSecondary, margin: "0 0 24px" }}>
                Hi {userName}, here&apos;s your performance summary for {date}.
              </Text>

              <Hr style={{ borderColor: palette.border, margin: "0 0 20px" }} />

              {/* Stats grid */}
              <Section style={{ marginBottom: "24px" }}>
                <Row>
                  <Column style={{ width: "33%", textAlign: "center" as const }}>
                    <Text style={{ fontSize: "28px", fontWeight: "700", color: palette.accent, margin: "0" }}>{stats.emailsSent}</Text>
                    <Text style={{ fontSize: "11px", color: palette.textMuted, margin: "4px 0 0", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Sent</Text>
                  </Column>
                  <Column style={{ width: "33%", textAlign: "center" as const }}>
                    <Text style={{ fontSize: "28px", fontWeight: "700", color: palette.success, margin: "0" }}>{openRate}%</Text>
                    <Text style={{ fontSize: "11px", color: palette.textMuted, margin: "4px 0 0", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Open Rate</Text>
                  </Column>
                  <Column style={{ width: "33%", textAlign: "center" as const }}>
                    <Text style={{ fontSize: "28px", fontWeight: "700", color: palette.warning, margin: "0" }}>{replyRate}%</Text>
                    <Text style={{ fontSize: "11px", color: palette.textMuted, margin: "4px 0 0", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Reply Rate</Text>
                  </Column>
                </Row>
              </Section>

              {/* Detailed breakdown */}
              <Section style={{ backgroundColor: palette.bgCardAlt, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                {[
                  { label: "Emails Opened", value: stats.emailsOpened, color: palette.text },
                  { label: "Replies Received", value: stats.emailsReplied, color: palette.text },
                  { label: "Positive / Interested", value: stats.positiveReplies, color: palette.success },
                  { label: "Bounced", value: stats.emailsBounced, color: stats.emailsBounced > 0 ? palette.danger : palette.text },
                  { label: "Prospects Added", value: stats.prospectsAdded, color: palette.text },
                ].map((row, i) => (
                  <Row key={i} style={{ borderBottom: i < 4 ? `1px solid ${palette.border}` : "none", padding: "8px 0" }}>
                    <Column>
                      <Text style={{ fontSize: "13px", color: palette.textSecondary, margin: 0 }}>{row.label}</Text>
                    </Column>
                    <Column style={{ textAlign: "right" as const }}>
                      <Text style={{ fontSize: "14px", color: row.color, margin: 0, fontWeight: "600" }}>{row.value}</Text>
                    </Column>
                  </Row>
                ))}
              </Section>

              {/* Top replies */}
              {topReplies.length > 0 && (
                <>
                  <Text style={{ fontSize: "14px", fontWeight: "600", color: palette.white, margin: "0 0 12px" }}>
                    🔥 Notable Replies
                  </Text>
                  {topReplies.slice(0, 3).map((reply, i) => (
                    <Section key={i} style={{ borderLeft: `3px solid ${palette.accent}`, paddingLeft: "12px", marginBottom: "12px" }}>
                      <Text style={{ fontSize: "13px", color: palette.text, margin: 0, fontWeight: "600" }}>
                        {reply.prospectName} — <span style={{ color: palette.success }}>{reply.category}</span>
                      </Text>
                      <Text style={{ fontSize: "12px", color: palette.textMuted, margin: "4px 0 0", lineHeight: "1.5" }}>
                        {reply.snippet.slice(0, 120)}{reply.snippet.length > 120 ? "..." : ""}
                      </Text>
                    </Section>
                  ))}
                </>
              )}

              <Hr style={{ borderColor: palette.border, margin: "20px 0" }} />

              <Link href={`${appUrl}/dashboard`} style={{
                display: "inline-block", backgroundColor: palette.accent, color: palette.white, padding: "12px 24px",
                borderRadius: "10px", fontSize: "14px", fontWeight: "600", textDecoration: "none",
              }}>
                View Full Dashboard →
              </Link>
            </div>
          </Section>

          <Text style={{ fontSize: "11px", color: palette.textMuted, textAlign: "center" as const, marginTop: "24px", lineHeight: "1.6" }}>
            You receive this daily digest based on your notification settings.{" "}
            <Link href={`${appUrl}/settings`} style={{ color: palette.accent }}>Manage preferences</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/* ────────────────────────────────────────────
   3. Weekly Report Email
   ──────────────────────────────────────────── */
export type WeeklyReportProps = {
  userName: string;
  weekRange: string; // e.g. "Mar 31 – Apr 6, 2026"
  stats: {
    emailsSent: number;
    emailsOpened: number;
    emailsReplied: number;
    emailsBounced: number;
    positiveReplies: number;
    meetingsBooked: number;
    prospectsAdded: number;
  };
  prevStats: {
    emailsSent: number;
    emailsOpened: number;
    emailsReplied: number;
  };
};

function trendArrow(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "↑" : "—";
  const change = Math.round(((current - previous) / previous) * 100);
  if (change > 0) return `↑ ${change}%`;
  if (change < 0) return `↓ ${Math.abs(change)}%`;
  return "→ 0%";
}

export function WeeklyReportEmail({
  userName = "User",
  weekRange = "Week",
  stats = { emailsSent: 0, emailsOpened: 0, emailsReplied: 0, emailsBounced: 0, positiveReplies: 0, meetingsBooked: 0, prospectsAdded: 0 },
  prevStats = { emailsSent: 0, emailsOpened: 0, emailsReplied: 0 },
}: WeeklyReportProps) {
  const openRate = stats.emailsSent > 0 ? Math.round((stats.emailsOpened / stats.emailsSent) * 100) : 0;
  const replyRate = stats.emailsSent > 0 ? Math.round((stats.emailsReplied / stats.emailsSent) * 100) : 0;

  return (
    <Html>
      <Head />
      <Preview>{`📈 Weekly Report — ${stats.emailsSent} emails, ${stats.positiveReplies} hot leads, ${stats.meetingsBooked} meetings`}</Preview>
      <Body style={{ backgroundColor: palette.bgPage, margin: 0, padding: 0, fontFamily: font }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 20px" }}>
          <Section style={{ backgroundColor: palette.bgCard, borderRadius: "16px", border: `1px solid ${palette.border}`, overflow: "hidden" }}>
            <div style={{ height: "4px", background: "linear-gradient(90deg, #7c5cfc 0%, #a78bfa 50%, #818cf8 100%)" }} />

            <div style={{ padding: "32px 28px" }}>
              <Heading style={{ fontSize: "20px", fontWeight: "700", color: palette.white, margin: "0 0 6px" }}>
                📈 Weekly Performance Report
              </Heading>
              <Text style={{ fontSize: "13px", color: palette.textSecondary, margin: "0 0 24px" }}>
                Hi {userName}, here&apos;s your weekly summary for {weekRange}.
              </Text>

              <Hr style={{ borderColor: palette.border, margin: "0 0 20px" }} />

              {/* Key metrics with trends */}
              <Section style={{ marginBottom: "24px" }}>
                <Row>
                  <Column style={{ width: "33%", textAlign: "center" as const }}>
                    <Text style={{ fontSize: "28px", fontWeight: "700", color: palette.accent, margin: "0" }}>{stats.emailsSent}</Text>
                    <Text style={{ fontSize: "11px", color: palette.textMuted, margin: "2px 0 0", textTransform: "uppercase" as const }}>Sent</Text>
                    <Text style={{ fontSize: "11px", color: stats.emailsSent >= prevStats.emailsSent ? palette.success : palette.danger, margin: "2px 0 0" }}>
                      {trendArrow(stats.emailsSent, prevStats.emailsSent)}
                    </Text>
                  </Column>
                  <Column style={{ width: "33%", textAlign: "center" as const }}>
                    <Text style={{ fontSize: "28px", fontWeight: "700", color: palette.success, margin: "0" }}>{openRate}%</Text>
                    <Text style={{ fontSize: "11px", color: palette.textMuted, margin: "2px 0 0", textTransform: "uppercase" as const }}>Opened</Text>
                    <Text style={{ fontSize: "11px", color: stats.emailsOpened >= prevStats.emailsOpened ? palette.success : palette.danger, margin: "2px 0 0" }}>
                      {trendArrow(stats.emailsOpened, prevStats.emailsOpened)}
                    </Text>
                  </Column>
                  <Column style={{ width: "33%", textAlign: "center" as const }}>
                    <Text style={{ fontSize: "28px", fontWeight: "700", color: palette.warning, margin: "0" }}>{replyRate}%</Text>
                    <Text style={{ fontSize: "11px", color: palette.textMuted, margin: "2px 0 0", textTransform: "uppercase" as const }}>Replied</Text>
                    <Text style={{ fontSize: "11px", color: stats.emailsReplied >= prevStats.emailsReplied ? palette.success : palette.danger, margin: "2px 0 0" }}>
                      {trendArrow(stats.emailsReplied, prevStats.emailsReplied)}
                    </Text>
                  </Column>
                </Row>
              </Section>

              {/* Full breakdown */}
              <Section style={{ backgroundColor: palette.bgCardAlt, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                {[
                  { label: "Total Emails Sent", value: stats.emailsSent },
                  { label: "Unique Opens", value: stats.emailsOpened },
                  { label: "Replies Received", value: stats.emailsReplied },
                  { label: "Positive / Interested", value: stats.positiveReplies, color: palette.success },
                  { label: "Meetings Booked", value: stats.meetingsBooked, color: palette.success },
                  { label: "Bounced", value: stats.emailsBounced, color: stats.emailsBounced > 0 ? palette.danger : palette.text },
                  { label: "New Prospects Added", value: stats.prospectsAdded },
                ].map((row, i) => (
                  <Row key={i} style={{ borderBottom: i < 6 ? `1px solid ${palette.border}` : "none", padding: "8px 0" }}>
                    <Column>
                      <Text style={{ fontSize: "13px", color: palette.textSecondary, margin: 0 }}>{row.label}</Text>
                    </Column>
                    <Column style={{ textAlign: "right" as const }}>
                      <Text style={{ fontSize: "14px", color: row.color || palette.text, margin: 0, fontWeight: "600" }}>{row.value}</Text>
                    </Column>
                  </Row>
                ))}
              </Section>

              <Link href={`${appUrl}/dashboard`} style={{
                display: "inline-block", backgroundColor: palette.accent, color: palette.white, padding: "12px 24px",
                borderRadius: "10px", fontSize: "14px", fontWeight: "600", textDecoration: "none",
              }}>
                View Full Analytics →
              </Link>
            </div>
          </Section>

          <Text style={{ fontSize: "11px", color: palette.textMuted, textAlign: "center" as const, marginTop: "24px", lineHeight: "1.6" }}>
            You receive this weekly report every Monday.{" "}
            <Link href={`${appUrl}/settings`} style={{ color: palette.accent }}>Manage preferences</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
