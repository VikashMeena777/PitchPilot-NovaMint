"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Send,
  Eye,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  CalendarCheck,
  Zap,
  Plus,
  Sparkles,
  Mail,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDashboardStats } from "@/lib/actions/user";

type DashboardData = {
  totalProspects: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  activeSequences: number;
  recentActivity: Array<{
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    status: string;
    created_at: string;
  }>;
};

const quickActions = [
  {
    label: "Add Prospects",
    description: "Upload CSV or add manually",
    icon: UserPlus,
    href: "/prospects",
    color: "from-[var(--pp-accent1)] to-indigo-700",
  },
  {
    label: "Create Sequence",
    description: "Set up automated outreach flow",
    icon: Zap,
    href: "/sequences",
    color: "from-[var(--pp-accent2)] to-emerald-700",
  },
  {
    label: "View Analytics",
    description: "Track campaign performance",
    icon: TrendingUp,
    href: "/analytics",
    color: "from-[var(--pp-accent3)] to-amber-700",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

const STATUS_COLORS: Record<string, string> = {
  new: "var(--pp-accent1)",
  contacted: "var(--pp-accent4)",
  opened: "var(--pp-accent3)",
  replied: "var(--pp-accent2)",
  interested: "#22c55e",
  not_interested: "#ef4444",
  meeting_booked: "#f59e0b",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stats = await getDashboardStats();
      setData(stats);
      setIsLoading(false);
    })();
  }, []);

  const stats = [
    {
      label: "Total Prospects",
      value: isLoading ? "—" : data?.totalProspects.toLocaleString() || "0",
      icon: Users,
      color: "var(--pp-accent1)",
      glow: "var(--pp-glow-indigo)",
    },
    {
      label: "Emails Sent",
      value: isLoading ? "—" : data?.emailsSent.toLocaleString() || "0",
      icon: Send,
      color: "var(--pp-accent2)",
      glow: "var(--pp-glow-emerald)",
    },
    {
      label: "Open Rate",
      value: isLoading ? "—" : `${data?.openRate || 0}%`,
      icon: Eye,
      color: "var(--pp-accent3)",
      glow: "var(--pp-glow-amber)",
    },
    {
      label: "Reply Rate",
      value: isLoading ? "—" : `${data?.replyRate || 0}%`,
      icon: MessageSquare,
      color: "var(--pp-accent4)",
      glow: "var(--pp-glow-pink)",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="show"
        variants={fadeInUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-[var(--pp-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Dashboard
          </h1>
          <p className="text-[var(--pp-text-secondary)] text-sm mt-1">
            Welcome back. Here&apos;s your outreach overview.
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo hover:glow-indigo-strong transition-all duration-200"
        >
          <Link href="/prospects">
            <Plus className="w-4 h-4 mr-2" />
            Add Prospects
          </Link>
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              custom={i + 1}
              initial="hidden"
              animate="show"
              variants={fadeInUp}
              className="relative group rounded-2xl p-5 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] card-hover overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${stat.glow}, transparent 70%)`,
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${stat.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  {!isLoading && (
                    <div className="flex items-center gap-1 text-xs font-medium text-[var(--pp-accent2)]">
                      <Sparkles className="w-3 h-3" />
                      Live
                    </div>
                  )}
                </div>
                <p
                  className="text-2xl font-bold text-[var(--pp-text-primary)] tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {isLoading ? (
                    <span className="inline-block w-16 h-7 bg-[var(--pp-bg-surface2)] rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="text-xs text-[var(--pp-text-muted)] mt-1">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Section + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="show"
          variants={fadeInUp}
          className="lg:col-span-2 rounded-2xl bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--pp-border-subtle)]">
            <div>
              <h3
                className="text-lg font-semibold text-[var(--pp-text-primary)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Recent Prospects
              </h3>
              <p className="text-xs text-[var(--pp-text-muted)] mt-0.5">Latest additions to your pipeline</p>
            </div>
            <Link href="/prospects" className="text-xs text-[var(--pp-accent1-light)] hover:underline flex items-center gap-1 cursor-pointer">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-[var(--pp-bg-surface2)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[var(--pp-bg-surface2)] rounded w-1/3" />
                    <div className="h-2 bg-[var(--pp-bg-surface2)] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="divide-y divide-[var(--pp-border-subtle)]">
              {data.recentActivity.map((prospect) => {
                const statusColor = STATUS_COLORS[prospect.status] || "var(--pp-text-muted)";
                const initials = [prospect.first_name?.[0], prospect.last_name?.[0]].filter(Boolean).join("").toUpperCase() || prospect.email[0].toUpperCase();
                const name = [prospect.first_name, prospect.last_name].filter(Boolean).join(" ") || prospect.email;
                return (
                  <div key={prospect.id} className="flex items-center gap-3 px-6 py-3 hover:bg-[var(--pp-bg-surface2)] transition-colors">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${statusColor}18`, color: statusColor }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--pp-text-primary)] truncate">{name}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--pp-text-muted)]">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{prospect.email}</span>
                        {prospect.company_name && (
                          <>
                            <span>·</span>
                            <span className="truncate">{prospect.company_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0"
                      style={{
                        color: statusColor,
                        backgroundColor: `${statusColor}12`,
                        borderColor: `${statusColor}25`,
                      }}
                    >
                      {prospect.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-8 h-8 mx-auto text-[var(--pp-text-muted)] mb-2" />
              <p className="text-sm text-[var(--pp-text-muted)]">No prospects yet</p>
              <p className="text-xs text-[var(--pp-text-muted)] mt-1">Add prospects to see them here</p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div custom={6} initial="hidden" animate="show" variants={fadeInUp} className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Quick Actions
          </h3>
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className="block group cursor-pointer">
                <motion.div
                  custom={i + 7}
                  initial="hidden"
                  animate="show"
                  variants={fadeInUp}
                  className="rounded-2xl p-4 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] card-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--pp-text-primary)] group-hover:text-[var(--pp-accent1-light)] transition-colors duration-200">
                        {action.label}
                      </p>
                      <p className="text-xs text-[var(--pp-text-muted)]">{action.description}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[var(--pp-text-muted)] ml-auto flex-shrink-0 group-hover:text-[var(--pp-accent1-light)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </motion.div>
              </Link>
            );
          })}

          {/* Active Sequences Summary */}
          <motion.div custom={10} initial="hidden" animate="show" variants={fadeInUp} className="rounded-2xl p-4 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)]">
            <div className="flex items-center gap-2 mb-3">
              <CalendarCheck className="w-4 h-4 text-[var(--pp-accent1-light)]" />
              <h4 className="text-sm font-semibold text-[var(--pp-text-primary)]">Active Sequences</h4>
            </div>
            {isLoading ? (
              <div className="h-4 bg-[var(--pp-bg-surface2)] rounded w-2/3 animate-pulse" />
            ) : data && data.activeSequences > 0 ? (
              <p className="text-sm text-[var(--pp-accent2)]">
                <span className="font-bold">{data.activeSequences}</span> sequence{data.activeSequences > 1 ? "s" : ""} running
              </p>
            ) : (
              <p className="text-xs text-[var(--pp-text-muted)]">
                No active sequences. Create one to start automated outreach.
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
