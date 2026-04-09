"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSequences, createSequence, deleteSequence, updateSequence } from "@/lib/actions/sequences";
import { SequenceBuilderModal } from "@/components/sequence-builder-modal";
import { createClient } from "@/lib/supabase/client";
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
  Mail,
  Users,
  Clock,
  Check,
  AlertCircle,
  Settings2,
} from "lucide-react";

type SequenceRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  sequence_steps: Array<{ count: number }>;
  sequence_enrollments: Array<{ count: number }>;
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Play }> = {
  draft: { label: "Draft", color: "var(--pp-text-muted)", icon: Clock },
  active: { label: "Active", color: "var(--pp-accent2)", icon: Play },
  paused: { label: "Paused", color: "var(--pp-accent3)", icon: Pause },
  completed: { label: "Completed", color: "var(--pp-accent1)", icon: Check },
};

export default function SequencesPage() {
  const [sequences, setSequences] = useState<SequenceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [builderTarget, setBuilderTarget] = useState<{ id: string; name: string } | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);

  useEffect(() => {
    const client = createClient();
    setSupabaseReady(!!client);
  }, []);

  const loadSequences = useCallback(async () => {
    if (!supabaseReady) { setIsLoading(false); return; }
    setIsLoading(true);
    const result = await getSequences();
    setSequences((result.data || []) as SequenceRow[]);
    setIsLoading(false);
  }, [supabaseReady]);

  useEffect(() => { loadSequences(); }, [loadSequences]);

  const handleToggleStatus = async (seq: SequenceRow) => {
    const newStatus = seq.status === "active" ? "paused" : "active";
    await updateSequence(seq.id, { status: newStatus });
    loadSequences();
  };

  const handleDelete = async (id: string) => {
    await deleteSequence(id);
    loadSequences();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className="space-y-6 max-w-7xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Sequences
          </h1>
          <p className="text-sm text-[var(--pp-text-muted)] mt-0.5">Automated multi-step email outreach</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Sequence
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-6 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] animate-pulse">
              <div className="h-5 bg-[var(--pp-bg-surface2)] rounded w-2/3 mb-3" />
              <div className="h-3 bg-[var(--pp-bg-surface2)] rounded w-full mb-2" />
              <div className="h-3 bg-[var(--pp-bg-surface2)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : sequences.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
          className="rounded-2xl p-16 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--pp-accent2)]/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-[var(--pp-accent2)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--pp-text-primary)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
            No sequences yet
          </h3>
          <p className="text-sm text-[var(--pp-text-muted)] max-w-sm mx-auto mb-6">
            Create your first automated email sequence. PitchMint&apos;s AI will personalize each message for every prospect.
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Your First Sequence
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map((seq, i) => {
            const statusInfo = STATUS_MAP[seq.status] || STATUS_MAP.draft;
            const StatusIcon = statusInfo.icon;
            const stepCount = seq.sequence_steps?.[0]?.count || 0;
            const enrollCount = seq.sequence_enrollments?.[0]?.count || 0;
            return (
              <motion.div
                key={seq.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const }}
                className="group rounded-2xl p-5 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] card-hover"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                      style={{
                        color: statusInfo.color,
                        backgroundColor: `${statusInfo.color}12`,
                        borderColor: `${statusInfo.color}25`,
                      }}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleStatus(seq)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] hover:text-[var(--pp-accent2)] transition-colors cursor-pointer"
                      title={seq.status === "active" ? "Pause" : "Activate"}
                    >
                      {seq.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(seq.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--pp-text-muted)] hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-[var(--pp-text-primary)] mb-1 truncate" style={{ fontFamily: "var(--font-display)" }}>
                  {seq.name}
                </h3>
                {seq.description && (
                  <p className="text-xs text-[var(--pp-text-muted)] mb-4 line-clamp-2">{seq.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-[var(--pp-text-muted)] pt-3 border-t border-[var(--pp-border-subtle)]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {stepCount} step{stepCount !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {enrollCount} enrolled
                  </span>
                  <button
                    onClick={() => setBuilderTarget({ id: seq.id, name: seq.name })}
                    className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[var(--pp-accent1)]/10 text-[var(--pp-text-muted)] hover:text-[var(--pp-accent1)] transition-colors cursor-pointer"
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>Edit Steps</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Sequence Modal */}
      <CreateSequenceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadSequences}
      />

      {/* Sequence Builder Modal */}
      {builderTarget && (
        <SequenceBuilderModal
          isOpen={!!builderTarget}
          onClose={() => { setBuilderTarget(null); loadSequences(); }}
          sequenceId={builderTarget.id}
          sequenceName={builderTarget.name}
        />
      )}
    </motion.div>
  );
}

function CreateSequenceModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setIsSubmitting(true);
    setError(null);
    const result = await createSequence({ name: name.trim(), description: description.trim() || undefined });
    if (result.error) {
      setError(result.error);
    } else {
      setName("");
      setDescription("");
      onSuccess();
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-strong rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-[var(--pp-border-subtle)]">
                <div>
                  <h2 className="text-lg font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>Create Sequence</h2>
                  <p className="text-xs text-[var(--pp-text-muted)] mt-0.5">Set up a new outreach flow</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Sequence name *</Label>
                  <Input value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder="Cold Outreach — SaaS Founders"
                    className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]" />
                </div>
                <div>
                  <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this sequence about?" rows={2}
                    className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)] resize-none" />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={onClose} className="text-[var(--pp-text-muted)] cursor-pointer">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || !name.trim()}
                    className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                    Create Sequence
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
