"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddProspectModal } from "@/components/add-prospect-modal";
import { CsvImportModal } from "@/components/csv-import-modal";
import { BulkActionsToolbar } from "@/components/bulk-actions-toolbar";
import { AIComposeModal } from "@/components/ai-compose-modal";
import { getProspects } from "@/lib/actions/prospects";
import { createClient } from "@/lib/supabase/client";
import {
  UserPlus,
  Upload,
  Search,
  Filter,
  Users,
  MoreHorizontal,
  Mail,
  Building2,
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

type ProspectRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  job_title: string | null;
  status: string;
  source: string;
  linkedin_url: string | null;
  total_emails_sent: number;
  total_opens: number;
  created_at: string;
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "var(--pp-accent1)" },
  contacted: { label: "Contacted", color: "var(--pp-accent4)" },
  opened: { label: "Opened", color: "var(--pp-accent3)" },
  replied: { label: "Replied", color: "var(--pp-accent2)" },
  interested: { label: "Interested", color: "#22c55e" },
  not_interested: { label: "Not Interested", color: "#ef4444" },
  meeting_booked: { label: "Meeting Booked", color: "#f59e0b" },
  unsubscribed: { label: "Unsubscribed", color: "#6b7280" },
};

const PAGE_SIZE = 20;

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<ProspectRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [aiTarget, setAiTarget] = useState<ProspectRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [supabaseReady, setSupabaseReady] = useState(false);

  useEffect(() => {
    const client = createClient();
    setSupabaseReady(!!client);
  }, []);

  const loadProspects = useCallback(async () => {
    if (!supabaseReady) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await getProspects({
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
    setProspects((result.data || []) as ProspectRow[]);
    setTotalCount(result.count || 0);
    setIsLoading(false);
  }, [search, statusFilter, page, supabaseReady]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSelectAll = () => {
    if (selectedIds.size === prospects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prospects.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold text-[var(--pp-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Prospects
          </h1>
          <p className="text-sm text-[var(--pp-text-muted)] mt-0.5">
            {totalCount} total prospect{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCsvModal(true)}
            variant="outline"
            className="bg-transparent border-[var(--pp-border-default)] text-[var(--pp-text-secondary)] hover:bg-[var(--pp-bg-surface2)] hover:border-[var(--pp-border-strong)] cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Import CSV
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pp-text-muted)]" />
          <Input
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-10 bg-[var(--pp-bg-surface)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--pp-text-muted)]" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="bg-[var(--pp-bg-surface)] border border-[var(--pp-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)] outline-none cursor-pointer"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_BADGES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Table or Empty State */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
        className="bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] rounded-2xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-[var(--pp-accent1)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[var(--pp-text-muted)]">Loading prospects...</p>
          </div>
        ) : prospects.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--pp-accent1)]/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[var(--pp-accent1)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--pp-text-primary)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
              {search || statusFilter !== "all" ? "No prospects match your filters" : "No prospects yet"}
            </h3>
            <p className="text-sm text-[var(--pp-text-muted)] mb-6 max-w-md mx-auto">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Add your first prospect manually or import a CSV to get started."}
            </p>
            {!search && statusFilter === "all" && (
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => setShowCsvModal(true)}
                  variant="outline"
                  className="bg-transparent border-[var(--pp-border-default)] text-[var(--pp-text-secondary)] hover:bg-[var(--pp-bg-surface2)] cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Import CSV
                </Button>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Add First Prospect
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--pp-border-subtle)]">
                    <th className="py-3 px-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === prospects.length && prospects.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-[var(--pp-border-default)] cursor-pointer accent-[var(--pp-accent1)]"
                      />
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--pp-text-muted)] uppercase tracking-wider">Prospect</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--pp-text-muted)] uppercase tracking-wider hidden md:table-cell">Company</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--pp-text-muted)] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--pp-text-muted)] uppercase tracking-wider hidden lg:table-cell">Emails</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--pp-text-muted)] uppercase tracking-wider hidden lg:table-cell">Opens</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((p) => {
                    const badge = STATUS_BADGES[p.status] || STATUS_BADGES.new;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-[var(--pp-border-subtle)] hover:bg-[var(--pp-bg-surface2)] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded border-[var(--pp-border-default)] cursor-pointer accent-[var(--pp-accent1)]"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-[var(--pp-text-primary)]">
                              {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Mail className="w-3 h-3 text-[var(--pp-text-muted)]" />
                              <span className="text-xs text-[var(--pp-text-muted)]">{p.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          {p.company_name ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[var(--pp-text-muted)]" />
                              <span className="text-sm text-[var(--pp-text-secondary)]">{p.company_name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--pp-text-muted)]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                            style={{
                              color: badge.color,
                              backgroundColor: `${badge.color}15`,
                              borderColor: `${badge.color}30`,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <span className="text-sm text-[var(--pp-text-secondary)]">{p.total_emails_sent}</span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <span className="text-sm text-[var(--pp-text-secondary)]">{p.total_opens}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setAiTarget(p)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--pp-accent1)]/10 text-[var(--pp-text-muted)] hover:text-[var(--pp-accent1)] transition-colors cursor-pointer"
                              title="AI Compose"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            {p.linkedin_url && (
                              <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] hover:text-[var(--pp-accent1)] transition-colors cursor-pointer">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--pp-border-subtle)]">
                <p className="text-xs text-[var(--pp-text-muted)]">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[var(--pp-text-secondary)] px-2">{page + 1} / {totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Bulk actions toolbar */}
            <BulkActionsToolbar
              selectedIds={Array.from(selectedIds)}
              onClearSelection={() => setSelectedIds(new Set())}
              onRefresh={loadProspects}
            />
          </>
        )}
      </motion.div>

      {/* Modals */}
      <AddProspectModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={loadProspects} />
      <CsvImportModal isOpen={showCsvModal} onClose={() => setShowCsvModal(false)} onSuccess={loadProspects} />
      {aiTarget && (
        <AIComposeModal isOpen={!!aiTarget} onClose={() => setAiTarget(null)} prospect={aiTarget} />
      )}
    </motion.div>
  );
}
