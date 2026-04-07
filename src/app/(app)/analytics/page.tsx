"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getDashboardStats } from "@/lib/actions/user";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  Users,
  Send,
  Eye,
  MessageSquare,
  TrendingUp,
  Target,
  Percent,
  ArrowUpRight,
} from "lucide-react";

type Stats = {
  totalProspects: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  activeSequences: number;
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);

  useEffect(() => {
    const client = createClient();
    setSupabaseReady(!!client);
  }, []);

  useEffect(() => {
    if (!supabaseReady) { setIsLoading(false); return; }
    (async () => {
      const data = await getDashboardStats();
      setStats(data);
      setIsLoading(false);
    })();
  }, [supabaseReady]);

  const kpiCards = [
    {
      label: "Total Prospects",
      value: stats?.totalProspects ?? 0,
      format: "number" as const,
      icon: Users,
      color: "var(--pp-accent1)",
      description: "Contacts in your pipeline",
    },
    {
      label: "Emails Sent",
      value: stats?.emailsSent ?? 0,
      format: "number" as const,
      icon: Send,
      color: "var(--pp-accent2)",
      description: "Total outreach emails",
    },
    {
      label: "Open Rate",
      value: stats?.openRate ?? 0,
      format: "percent" as const,
      icon: Eye,
      color: "var(--pp-accent3)",
      description: "Of sent emails opened",
    },
    {
      label: "Reply Rate",
      value: stats?.replyRate ?? 0,
      format: "percent" as const,
      icon: MessageSquare,
      color: "var(--pp-accent4)",
      description: "Of sent emails replied",
    },
    {
      label: "Active Sequences",
      value: stats?.activeSequences ?? 0,
      format: "number" as const,
      icon: TrendingUp,
      color: "var(--pp-accent2)",
      description: "Running outreach flows",
    },
    {
      label: "Conversion Rate",
      value: stats && stats.totalProspects > 0 ? Math.round(((stats.replyRate / 100) * stats.emailsSent / Math.max(1, stats.totalProspects)) * 100) : 0,
      format: "percent" as const,
      icon: Target,
      color: "var(--pp-accent1)",
      description: "Prospects → Replies",
    },
  ];

  // Visual bar chart data for funnel
  const funnelStages = [
    { label: "Prospects", value: stats?.totalProspects ?? 0, color: "var(--pp-accent1)" },
    { label: "Emails Sent", value: stats?.emailsSent ?? 0, color: "var(--pp-accent2)" },
    { label: "Opened", value: stats ? Math.round((stats.openRate / 100) * stats.emailsSent) : 0, color: "var(--pp-accent3)" },
    { label: "Replied", value: stats ? Math.round((stats.replyRate / 100) * stats.emailsSent) : 0, color: "var(--pp-accent4)" },
  ];

  const maxFunnel = Math.max(...funnelStages.map((s) => s.value), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className="space-y-8 max-w-7xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
          Analytics
        </h1>
        <p className="text-sm text-[var(--pp-text-muted)] mt-0.5">Understand your outreach performance</p>
      </div>

      {/* KPI Grid — Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const }}
              className="group rounded-2xl p-5 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] card-hover relative overflow-hidden"
            >
              {/* Accent top line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: kpi.color }} />

              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}12` }}>
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--pp-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <p className="text-2xl font-bold text-[var(--pp-text-primary)] tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                {isLoading ? (
                  <span className="inline-block w-16 h-7 bg-[var(--pp-bg-surface2)] rounded animate-pulse" />
                ) : (
                  <>
                    {kpi.format === "percent" ? `${kpi.value}%` : kpi.value.toLocaleString()}
                  </>
                )}
              </p>
              <p className="text-xs text-[var(--pp-text-muted)] mt-1">{kpi.label}</p>
              <p className="text-[10px] text-[var(--pp-text-muted)] mt-0.5 opacity-60">{kpi.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Outreach Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
        className="rounded-2xl p-6 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)]"
      >
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-[var(--pp-accent1)]" />
          <h3 className="text-lg font-semibold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Outreach Funnel
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-24 h-4 bg-[var(--pp-bg-surface2)] rounded" />
                <div className="flex-1 h-8 bg-[var(--pp-bg-surface2)] rounded-lg" />
                <div className="w-10 h-4 bg-[var(--pp-bg-surface2)] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {funnelStages.map((stage, i) => {
              const widthPercent = Math.max(4, (stage.value / maxFunnel) * 100);
              return (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
                  className="flex items-center gap-4"
                >
                  <span className="text-xs text-[var(--pp-text-muted)] w-24 text-right flex-shrink-0">{stage.label}</span>
                  <div className="flex-1 relative">
                    <div className="h-9 rounded-lg bg-[var(--pp-bg-surface2)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.15, ease: [0.16, 1, 0.3, 1] as const }}
                        className="h-full rounded-lg flex items-center px-3"
                        style={{ background: `linear-gradient(90deg, ${stage.color}30, ${stage.color}60)` }}
                      >
                        {widthPercent > 15 && (
                          <span className="text-xs font-semibold" style={{ color: stage.color }}>
                            {stage.value.toLocaleString()}
                          </span>
                        )}
                      </motion.div>
                    </div>
                  </div>
                  {widthPercent <= 15 && (
                    <span className="text-xs font-semibold text-[var(--pp-text-secondary)] w-10 flex-shrink-0">
                      {stage.value.toLocaleString()}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Performance Tips */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="rounded-2xl p-6 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)]"
      >
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-[var(--pp-accent3)]" />
          <h3 className="text-lg font-semibold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Performance Benchmarks
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Open Rate", yours: stats?.openRate ?? 0, benchmark: 45, unit: "%" },
            { label: "Reply Rate", yours: stats?.replyRate ?? 0, benchmark: 8, unit: "%" },
            { label: "Emails / Prospect", yours: stats && stats.totalProspects > 0 ? (stats.emailsSent / stats.totalProspects).toFixed(1) : "0", benchmark: "3.5", unit: "" },
          ].map((bench, i) => (
            <div key={bench.label} className="p-4 rounded-xl bg-[var(--pp-bg-deepest)] border border-[var(--pp-border-subtle)]">
              <p className="text-xs text-[var(--pp-text-muted)] mb-2">{bench.label}</p>
              <div className="flex items-end gap-3">
                <div>
                  <p className="text-[10px] text-[var(--pp-text-muted)] uppercase tracking-wider mb-0.5">Yours</p>
                  <p className="text-lg font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                    {isLoading ? "—" : `${bench.yours}${bench.unit}`}
                  </p>
                </div>
                <div className="pb-0.5">
                  <p className="text-[10px] text-[var(--pp-text-muted)] uppercase tracking-wider mb-0.5">Benchmark</p>
                  <p className="text-sm text-[var(--pp-accent2)]">{bench.benchmark}{bench.unit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
