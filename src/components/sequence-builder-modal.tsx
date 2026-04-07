"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSequenceById, addSequenceStep } from "@/lib/actions/sequences";
import {
  X,
  Plus,
  Clock,
  Mail,
  GripVertical,
  Loader2,
  Check,
  ChevronRight,
} from "lucide-react";

type Step = {
  id: string;
  step_number: number;
  subject_template: string;
  body_template: string;
  delay_days: number;
  step_type: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  sequenceId: string;
  sequenceName: string;
};

export function SequenceBuilderModal({ isOpen, onClose, sequenceId, sequenceName }: Props) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New step form
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newDelay, setNewDelay] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSteps();
    }
  }, [isOpen, sequenceId]);

  const loadSteps = async () => {
    setIsLoading(true);
    const result = await getSequenceById(sequenceId);
    if (result.data) {
      setSteps((result.data.sequence_steps || []) as Step[]);
    }
    setIsLoading(false);
  };

  const handleAddStep = async () => {
    if (!newSubject.trim() || !newBody.trim()) return;
    setIsSaving(true);

    const result = await addSequenceStep(sequenceId, {
      step_number: steps.length + 1,
      subject_template: newSubject,
      body_template: newBody,
      delay_days: newDelay,
    });

    if (result.data) {
      await loadSteps();
      setNewSubject("");
      setNewBody("");
      setNewDelay(1);
      setShowAddForm(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setIsSaving(false);
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
            <div className="glass-strong rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--pp-border-subtle)] sticky top-0 bg-[var(--pp-bg-surface)]/90 backdrop-blur-md z-10 rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                    Sequence Builder
                  </h2>
                  <p className="text-xs text-[var(--pp-text-muted)] mt-0.5">{sequenceName} · {steps.length} step{steps.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-[var(--pp-accent1)] animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Existing Steps */}
                    {steps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {/* Delay indicator (between steps) */}
                        {index > 0 && (
                          <div className="flex items-center gap-2 py-2 pl-6">
                            <div className="w-px h-4 bg-[var(--pp-border-subtle)]" />
                            <Clock className="w-3 h-3 text-[var(--pp-text-muted)]" />
                            <span className="text-[10px] text-[var(--pp-text-muted)]">
                              Wait {step.delay_days} day{step.delay_days !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                        <div
                          onClick={() => setActiveStep(activeStep === index ? null : index)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            activeStep === index
                              ? "border-[var(--pp-accent1)] bg-[var(--pp-accent1)]/5"
                              : "border-[var(--pp-border-subtle)] bg-[var(--pp-bg-deepest)] hover:border-[var(--pp-border-default)]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <GripVertical className="w-3.5 h-3.5 text-[var(--pp-text-muted)]" />
                              <div className="w-7 h-7 rounded-lg bg-[var(--pp-accent1)]/10 flex items-center justify-center">
                                <Mail className="w-3.5 h-3.5 text-[var(--pp-accent1)]" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--pp-text-muted)] font-medium">Step {step.step_number}</span>
                                <ChevronRight className={`w-3 h-3 text-[var(--pp-text-muted)] transition-transform ${activeStep === index ? "rotate-90" : ""}`} />
                              </div>
                              <p className="text-sm font-medium text-[var(--pp-text-primary)] truncate">{step.subject_template || "No subject"}</p>
                            </div>
                          </div>

                          {/* Expanded content */}
                          <AnimatePresence>
                            {activeStep === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 pt-3 border-t border-[var(--pp-border-subtle)]"
                              >
                                <p className="text-xs text-[var(--pp-text-muted)] mb-1">Email body:</p>
                                <p className="text-sm text-[var(--pp-text-secondary)] whitespace-pre-wrap leading-relaxed">
                                  {step.body_template || "No body content"}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}

                    {/* Add Step Form */}
                    {showAddForm ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl border border-[var(--pp-accent2)] bg-[var(--pp-accent2)]/5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[var(--pp-accent2)]">New Step #{steps.length + 1}</span>
                          <button onClick={() => setShowAddForm(false)} className="text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {steps.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[var(--pp-text-muted)]" />
                            <span className="text-xs text-[var(--pp-text-muted)]">Wait</span>
                            <Input
                              type="number"
                              min={1}
                              max={30}
                              value={newDelay}
                              onChange={(e) => setNewDelay(parseInt(e.target.value) || 1)}
                              className="w-16 h-7 text-xs bg-[var(--pp-bg-deepest)] border-[var(--pp-border-subtle)] text-[var(--pp-text-primary)] text-center"
                            />
                            <span className="text-xs text-[var(--pp-text-muted)]">day{newDelay !== 1 ? "s" : ""} after previous step</span>
                          </div>
                        )}

                        <Input
                          placeholder="Email subject line..."
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-subtle)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)]"
                        />

                        <textarea
                          placeholder="Email body template... Use {{first_name}}, {{company_name}} for personalization"
                          value={newBody}
                          onChange={(e) => setNewBody(e.target.value)}
                          rows={5}
                          className="w-full p-3 rounded-lg bg-[var(--pp-bg-deepest)] border border-[var(--pp-border-subtle)] text-sm text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] resize-none focus:outline-none focus:border-[var(--pp-accent1)] transition-colors"
                        />

                        <div className="flex gap-2">
                          <Button
                            onClick={handleAddStep}
                            disabled={isSaving || !newSubject.trim() || !newBody.trim()}
                            className="bg-gradient-to-r from-[var(--pp-accent2)] to-emerald-700 text-white font-semibold cursor-pointer btn-hover"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            Save Step
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--pp-border-subtle)] hover:border-[var(--pp-accent1)] text-[var(--pp-text-muted)] hover:text-[var(--pp-accent1)] flex items-center justify-center gap-2 transition-all cursor-pointer group"
                      >
                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Add Step</span>
                      </button>
                    )}

                    {/* Success toast */}
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg bg-[var(--pp-accent2)]/10 border border-[var(--pp-accent2)]/20 text-sm text-[var(--pp-accent2)] flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Step added successfully!
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
