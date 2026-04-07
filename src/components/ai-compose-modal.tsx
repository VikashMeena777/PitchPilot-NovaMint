"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { aiResearchProspect, aiGenerateEmail, aiGenerateVariants } from "@/lib/actions/ai";
import { sendProspectEmail } from "@/lib/actions/emails";
import type { GeneratedEmail, ProspectResearch } from "@/lib/ai/engine";
import {
  X,
  Sparkles,
  Brain,
  Send,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Lightbulb,
  Target,
  MessageSquare,
  Zap,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  prospect: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    company_name: string | null;
    job_title: string | null;
  };
};

const TONE_OPTIONS = [
  { value: "professional" as const, label: "Professional", icon: Target, color: "var(--pp-accent1)" },
  { value: "casual" as const, label: "Casual", icon: MessageSquare, color: "var(--pp-accent2)" },
  { value: "bold" as const, label: "Bold", icon: Zap, color: "var(--pp-accent3)" },
  { value: "consultative" as const, label: "Consultative", icon: Lightbulb, color: "var(--pp-accent4)" },
];

export function AIComposeModal({ isOpen, onClose, prospect }: Props) {
  const [step, setStep] = useState<"research" | "compose" | "preview">("research");
  const [research, setResearch] = useState<ProspectResearch | null>(null);
  const [emails, setEmails] = useState<GeneratedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState(0);
  const [selectedTone, setSelectedTone] = useState<"professional" | "casual" | "bold" | "consultative">("professional");
  const [isResearching, setIsResearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = [prospect.first_name, prospect.last_name].filter(Boolean).join(" ") || prospect.email;

  const handleResearch = async () => {
    setIsResearching(true);
    setError(null);
    const result = await aiResearchProspect(prospect.id);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setResearch(result.data);
      setStep("compose");
    }
    setIsResearching(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    const result = await aiGenerateEmail({ prospectId: prospect.id, tone: selectedTone });
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setEmails([result.data]);
      setSelectedEmail(0);
      setStep("preview");
    }
    setIsGenerating(false);
  };

  const handleGenerateVariants = async () => {
    setIsGenerating(true);
    setError(null);
    const result = await aiGenerateVariants(prospect.id);
    if (result.error) {
      setError(result.error);
    } else if (result.data.length > 0) {
      setEmails(result.data);
      setSelectedEmail(0);
      setStep("preview");
    }
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (!emails[selectedEmail]) return;
    const email = emails[selectedEmail];
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep("research");
    setResearch(null);
    setEmails([]);
    setError(null);
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
            <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--pp-border-subtle)] sticky top-0 bg-[var(--pp-bg-surface)]/90 backdrop-blur-md z-10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--pp-accent1)] to-[var(--pp-accent4)] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                      AI Compose
                    </h2>
                    <p className="text-xs text-[var(--pp-text-muted)]">for {name}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="px-6 py-3 border-b border-[var(--pp-border-subtle)] flex items-center gap-4">
                {["research", "compose", "preview"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${step === s ? "bg-[var(--pp-accent1)] text-white" : i < ["research", "compose", "preview"].indexOf(step) ? "bg-[var(--pp-accent2)] text-white" : "bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)]"}`}>
                      {i + 1}
                    </div>
                    <span className={`text-xs capitalize ${step === s ? "text-[var(--pp-text-primary)] font-medium" : "text-[var(--pp-text-muted)]"}`}>{s}</span>
                    {i < 2 && <div className="w-8 h-px bg-[var(--pp-border-subtle)]" />}
                  </div>
                ))}
              </div>

              <div className="p-6">
                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
                    <Zap className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}

                {/* Step 1: Research */}
                {step === "research" && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="text-center py-4">
                      <Brain className="w-12 h-12 text-[var(--pp-accent1)] mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                        Research {prospect.first_name || "Prospect"}
                      </h3>
                      <p className="text-sm text-[var(--pp-text-muted)] mt-1 max-w-sm mx-auto">
                        AI will analyze this prospect and generate personalized insights for your outreach.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--pp-bg-deepest)] border border-[var(--pp-border-subtle)]">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-[var(--pp-text-muted)]">Email:</span> <span className="text-[var(--pp-text-primary)]">{prospect.email}</span></div>
                        <div><span className="text-[var(--pp-text-muted)]">Company:</span> <span className="text-[var(--pp-text-primary)]">{prospect.company_name || "—"}</span></div>
                        <div><span className="text-[var(--pp-text-muted)]">Title:</span> <span className="text-[var(--pp-text-primary)]">{prospect.job_title || "—"}</span></div>
                      </div>
                    </div>

                    <Button
                      onClick={handleResearch}
                      disabled={isResearching}
                      className="w-full bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent4)] text-white font-semibold cursor-pointer btn-hover h-12 text-base"
                    >
                      {isResearching ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Researching...</>
                      ) : (
                        <><Brain className="w-5 h-5 mr-2" /> Research &amp; Continue</>
                      )}
                    </Button>

                    <button onClick={() => setStep("compose")} className="w-full text-center text-xs text-[var(--pp-text-muted)] hover:text-[var(--pp-accent1-light)] cursor-pointer py-1">
                      Skip research →
                    </button>
                  </motion.div>
                )}

                {/* Step 2: Compose */}
                {step === "compose" && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {research && (
                      <div className="p-4 rounded-xl bg-[var(--pp-accent1)]/5 border border-[var(--pp-accent1)]/15 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-[var(--pp-accent1-light)]">
                          <Brain className="w-4 h-4" /> AI Research Results
                        </div>
                        <p className="text-sm text-[var(--pp-text-secondary)]">{research.summary}</p>
                        <div className="flex flex-wrap gap-2">
                          {(research.pain_points || []).map((pp: string, i: number) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--pp-accent3)]/10 border border-[var(--pp-accent3)]/20 text-[var(--pp-accent3)]">
                              {pp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-[var(--pp-text-primary)] mb-3">Select tone</p>
                      <div className="grid grid-cols-2 gap-2">
                        {TONE_OPTIONS.map((tone) => {
                          const Icon = tone.icon;
                          const active = selectedTone === tone.value;
                          return (
                            <button
                              key={tone.value}
                              onClick={() => setSelectedTone(tone.value)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${active ? "border-[var(--pp-accent1)] bg-[var(--pp-accent1)]/8" : "border-[var(--pp-border-subtle)] hover:border-[var(--pp-border-default)] bg-[var(--pp-bg-deepest)]"}`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" style={{ color: active ? tone.color : "var(--pp-text-muted)" }} />
                                <span className={`text-sm font-medium ${active ? "text-[var(--pp-text-primary)]" : "text-[var(--pp-text-muted)]"}`}>{tone.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleGenerate} disabled={isGenerating}
                        className="flex-1 bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover h-11">
                        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Generate Email
                      </Button>
                      <Button onClick={handleGenerateVariants} disabled={isGenerating} variant="outline"
                        className="border-[var(--pp-border-default)] text-[var(--pp-text-secondary)] hover:bg-[var(--pp-bg-surface2)] cursor-pointer h-11">
                        <Sparkles className="w-4 h-4 mr-2" /> 3 Variants
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Preview */}
                {step === "preview" && emails.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Variant tabs */}
                    {emails.length > 1 && (
                      <div className="flex gap-1 p-1 rounded-lg bg-[var(--pp-bg-deepest)]">
                        {emails.map((email, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedEmail(i)}
                            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${selectedEmail === i ? "bg-[var(--pp-accent1)] text-white" : "text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)]"}`}
                          >
                            {email.tone.charAt(0).toUpperCase() + email.tone.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Email preview */}
                    <div className="rounded-xl bg-[var(--pp-bg-deepest)] border border-[var(--pp-border-subtle)] overflow-hidden">
                      <div className="px-4 py-3 border-b border-[var(--pp-border-subtle)]">
                        <p className="text-xs text-[var(--pp-text-muted)] mb-1">Subject</p>
                        <p className="text-sm font-semibold text-[var(--pp-text-primary)]">{emails[selectedEmail].subject}</p>
                      </div>
                      <div className="px-4 py-4">
                        <p className="text-sm text-[var(--pp-text-secondary)] whitespace-pre-wrap leading-relaxed">
                          {emails[selectedEmail].body}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          if (!emails[selectedEmail] || isSending) return;
                          setIsSending(true);
                          setError(null);
                          const result = await sendProspectEmail({
                            prospectId: prospect.id,
                            subject: emails[selectedEmail].subject,
                            body: emails[selectedEmail].body,
                          });
                          if (result.error) {
                            setError(result.error);
                          } else {
                            setSendSuccess(true);
                            setTimeout(() => { onClose(); }, 2000);
                          }
                          setIsSending(false);
                        }}
                        disabled={isSending || sendSuccess}
                        className="flex-1 bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent4)] text-white font-semibold cursor-pointer btn-hover"
                      >
                        {sendSuccess ? (
                          <><Check className="w-4 h-4 mr-2" /> Sent!</>
                        ) : isSending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                        ) : (
                          <><Send className="w-4 h-4 mr-2" /> Send Email</>
                        )}
                      </Button>
                      <Button onClick={handleCopy} variant="outline" className="border-[var(--pp-border-default)] text-[var(--pp-text-secondary)] hover:bg-[var(--pp-bg-surface2)] cursor-pointer">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button onClick={handleReset} variant="outline" className="border-[var(--pp-border-default)] text-[var(--pp-text-secondary)] hover:bg-[var(--pp-bg-surface2)] cursor-pointer">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
