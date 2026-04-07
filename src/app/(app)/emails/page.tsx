"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getEmails } from "@/lib/actions/sequences";
import { createClient } from "@/lib/supabase/client";
import {
  Send,
  Eye,
  EyeOff,
  MessageSquare,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

type EmailRow = {
  id: string;
  subject: string;
  status: string;
  open_count: number;
  click_count: number;
  has_reply: boolean;
  sent_at: string | null;
  created_at: string;
  prospects: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
  } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Send }> = {
  draft: { label: "Draft", color: "var(--pp-text-muted)", icon: Clock },
  queued: { label: "Queued", color: "var(--pp-accent4)", icon: Clock },
  sent: { label: "Sent", color: "var(--pp-accent2)", icon: CheckCircle2 },
  opened: { label: "Opened", color: "var(--pp-accent3)", icon: Eye },
  replied: { label: "Replied", color: "var(--pp-accent1)", icon: MessageSquare },
  bounced: { label: "Bounced", color: "#ef4444", icon: AlertTriangle },
  failed: { label: "Failed", color: "#ef4444", icon: AlertTriangle },
};

const PAGE_SIZE = 20;

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [supabaseReady, setSupabaseReady] = useState(false);

  useEffect(() => {
    const client = createClient();
    setSupabaseReady(!!client);
  }, []);

  const loadEmails = useCallback(async () => {
    if (!supabaseReady) { setIsLoading(false); return; }
    setIsLoading(true);
    const result = await getEmails({
      status: statusFilter !== "all" ? statusFilter : undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
    setEmails((result.data || []) as EmailRow[]);
    setTotalCount(result.count || 0);
    setIsLoading(false);
  }, [statusFilter, page, supabaseReady]);

  useEffect(() => { loadEmails(); }, [loadEmails]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Summary stats
  const sentCount = emails.filter((e) => ["sent", "opened", "replied"].includes(e.status)).length;
  const openedCount = emails.filter((e) => e.open_count > 0).length;
  const repliedCount = emails.filter((e) => e.has_reply).length;

  const summaryStats = [
    { label: "Total Emails", value: totalCount, icon: Mail, color: "var(--pp-accent1)" },
    { label: "Sent", value: sentCount, icon: Send, color: "var(--pp-accent2)" },
    { label: "Opened", value: openedCount, icon: Eye, color: "var(--pp-accent3)" },
    { label: "Replied", value: repliedCount, icon: MessageSquare, color: "var(--pp-accent4)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className="space-y-6 max-w-7xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
          Emails
        </h1>
        <p className="text-sm text-[var(--pp-text-muted)] mt-0.5">Track all sent, scheduled, and draft emails</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const }}
              className="rounded-xl p-4 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-xs text-[var(--pp-text-muted)]">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                {isLoading ? <span className="inline-block w-10 h-6 bg-[var(--pp-bg-surface2)] rounded animate-pulse" /> : stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-[var(--pp-text-muted)]" />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="bg-[var(--pp-bg-surface)] border border-[var(--pp-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)] outline-none cursor-pointer"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Email List */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
        className="bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] rounded-2xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[var(--pp-accent1)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[var(--pp-text-muted)]">Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--pp-accent1)]/10 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-[var(--pp-accent1)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--pp-text-primary)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
              {statusFilter !== "all" ? "No emails match this filter" : "No emails sent yet"}
            </h3>
            <p className="text-sm text-[var(--pp-text-muted)] max-w-sm mx-auto">
              {statusFilter !== "all" ? "Try a different status filter." : "Create a sequence and add prospects to start sending emails."}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--pp-border-subtle)]">
              {emails.map((email) => {
                const config = STATUS_CONFIG[email.status] || STATUS_CONFIG.draft;
                const StatusIcon = config.icon;
                const recipientName = email.prospects ? [email.prospects.first_name, email.prospects.last_name].filter(Boolean).join(" ") || email.prospects.email : "Unknown";
                return (
                  <div key={email.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--pp-bg-surface2)] transition-colors">
                    {/* Status icon */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${config.color}12` }}>
                      <StatusIcon className="w-4 h-4" style={{ color: config.color }} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--pp-text-primary)] truncate">{email.subject || "(No subject)"}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--pp-text-muted)] mt-0.5">
                        <span>To: {recipientName}</span>
                        {email.prospects?.company_name && (
                          <>
                            <span>·</span>
                            <span>{email.prospects.company_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="hidden sm:flex items-center gap-4 text-xs text-[var(--pp-text-muted)] flex-shrink-0">
                      <span className="flex items-center gap-1" title="Opens">
                        {email.open_count > 0 ? <Eye className="w-3 h-3 text-[var(--pp-accent3)]" /> : <EyeOff className="w-3 h-3" />}
                        {email.open_count}
                      </span>
                      <span className="flex items-center gap-1" title="Clicks">
                        <ArrowUpRight className="w-3 h-3" />
                        {email.click_count}
                      </span>
                      {email.has_reply && (
                        <span className="text-[var(--pp-accent2)] font-medium flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Replied
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0"
                      style={{
                        color: config.color,
                        backgroundColor: `${config.color}12`,
                        borderColor: `${config.color}25`,
                      }}
                    >
                      {config.label}
                    </span>

                    {/* Date */}
                    <span className="text-[10px] text-[var(--pp-text-muted)] flex-shrink-0 hidden lg:block w-20 text-right">
                      {email.sent_at ? new Date(email.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) :
                        new Date(email.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--pp-border-subtle)]">
                <p className="text-xs text-[var(--pp-text-muted)]">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] disabled:opacity-30 cursor-pointer transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[var(--pp-text-secondary)] px-2">{page + 1} / {totalPages}</span>
                  <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] disabled:opacity-30 cursor-pointer transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
