"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Target,
  Mail,
  Users,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Business", icon: Building2 },
  { id: 2, label: "Audience", icon: Target },
  { id: 3, label: "Tone", icon: Sparkles },
  { id: 4, label: "Email", icon: Mail },
];

const TONE_OPTIONS = [
  {
    value: "professional" as const,
    label: "Professional",
    description: "Polished, formal, and business-appropriate. Ideal for enterprise prospects.",
    emoji: "💼",
    sample: `Hi {{first_name}}, I noticed {{company}} recently expanded into {{industry}}. Given your role as {{job_title}}, I wanted to share how we help similar teams...`,
  },
  {
    value: "casual" as const,
    label: "Casual",
    description: "Friendly, conversational, and relatable. Great for startups and SMBs.",
    emoji: "👋",
    sample: `Hey {{first_name}}! Saw what {{company}} is doing — pretty cool stuff. Quick question: are you still handling {{pain_point}} manually?`,
  },
  {
    value: "bold" as const,
    label: "Bold",
    description: "Direct, confident, and attention-grabbing. Cuts through inbox noise.",
    emoji: "🔥",
    sample: `{{first_name}}, your competitors are already using AI to 3x their outreach. Here's the gap I see at {{company}} — and how to close it in 48 hours.`,
  },
  {
    value: "consultative" as const,
    label: "Consultative",
    description: "Insightful, value-first, expert positioning. Best for complex B2B sales.",
    emoji: "🧠",
    sample: `{{first_name}}, after researching {{company}}'s approach to {{industry}}, I identified 3 areas where similar companies are seeing 40%+ improvements...`,
  },
];

type TonePreset = "professional" | "casual" | "bold" | "consultative";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [valueProposition, setValueProposition] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tonePreset, setTonePreset] = useState<TonePreset>("professional");
  const [sendingEmail, setSendingEmail] = useState("");
  const [sendingName, setSendingName] = useState("");

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return companyName.trim().length > 0 && valueProposition.trim().length > 0;
      case 2:
        return targetAudience.trim().length > 0;
      case 3:
        return true; // tone always has default
      case 4:
        return true; // email setup is optional
      default:
        return false;
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        router.push("/dashboard");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      await supabase.from("users").update({
        company_name: companyName,
        value_proposition: valueProposition,
        target_audience: targetAudience,
        tone_preset: tonePreset,
        sending_email: sendingEmail || null,
        sending_name: sendingName || null,
        onboarding_completed: true,
      }).eq("id", user.id);

      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
    else handleComplete();
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Aurora background */}
      <div className="fixed inset-0 bg-[var(--pp-bg-deepest)]">
        <div className="orb orb-indigo" style={{ width: 600, height: 600, top: "-15%", left: "-10%" }} />
        <div className="orb orb-pink" style={{ width: 500, height: 500, bottom: "-10%", right: "-8%" }} />
        <div className="orb orb-emerald" style={{ width: 350, height: 350, top: "50%", right: "30%" }} />
        <div className="absolute inset-0 grid-pattern" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        className="relative z-10 w-full max-w-2xl mx-4"
      >
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--pp-accent1)] to-[var(--pp-accent4)] flex items-center justify-center shadow-lg glow-indigo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
              PitchPilot
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--pp-text-primary)] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Let&apos;s set up your outreach
          </h1>
          <p className="text-[var(--pp-text-muted)] text-sm">
            This takes about 2 minutes. You can change everything later.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-[var(--pp-accent1)]/20 text-[var(--pp-accent1-light)] border border-[var(--pp-accent1)]/40"
                      : isCompleted
                      ? "bg-[var(--pp-accent2)]/15 text-[var(--pp-accent2)] border border-[var(--pp-accent2)]/30"
                      : "bg-[var(--pp-bg-surface)] text-[var(--pp-text-muted)] border border-[var(--pp-border-subtle)]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {step.id < 4 && (
                  <div className={`w-6 h-px ${isCompleted ? "bg-[var(--pp-accent2)]" : "bg-[var(--pp-border-subtle)]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-2xl min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait">
            {/* STEP 1: Business Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-lg font-semibold text-[var(--pp-text-primary)] mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Tell us about your business
                </h2>
                <p className="text-sm text-[var(--pp-text-muted)] mb-6">
                  This helps our AI write authentic, on-brand emails.
                </p>

                <div className="space-y-4 flex-1">
                  <div>
                    <Label htmlFor="company" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">
                      Company name *
                    </Label>
                    <Input
                      id="company"
                      placeholder="e.g. Acme SaaS"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)] focus:ring-[var(--pp-accent1)]/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="value-prop" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">
                      What does your company do? *
                    </Label>
                    <Textarea
                      id="value-prop"
                      placeholder="e.g. We help B2B SaaS companies reduce churn by 40% with predictive analytics"
                      value={valueProposition}
                      onChange={(e) => setValueProposition(e.target.value)}
                      rows={3}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)] focus:ring-[var(--pp-accent1)]/20 resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Target Audience */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-lg font-semibold text-[var(--pp-text-primary)] mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Who are you reaching out to?
                </h2>
                <p className="text-sm text-[var(--pp-text-muted)] mb-6">
                  This trains the AI to research and personalize for your ideal customer.
                </p>

                <div className="space-y-4 flex-1">
                  <div>
                    <Label htmlFor="audience" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">
                      Describe your target audience *
                    </Label>
                    <Textarea
                      id="audience"
                      placeholder="e.g. VP of Engineering and CTOs at Series A-C SaaS companies with 50-500 employees, especially those using legacy analytics tools"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      rows={4}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)] focus:ring-[var(--pp-accent1)]/20 resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Tone Selection */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-lg font-semibold text-[var(--pp-text-primary)] mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Pick your email tone
                </h2>
                <p className="text-sm text-[var(--pp-text-muted)] mb-5">
                  Choose a default style. The AI adapts this per-prospect automatically.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setTonePreset(tone.value)}
                      className={`text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        tonePreset === tone.value
                          ? "bg-[var(--pp-accent1)]/10 border-[var(--pp-accent1)]/50 glow-indigo"
                          : "bg-[var(--pp-bg-deepest)] border-[var(--pp-border-subtle)] hover:border-[var(--pp-border-default)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{tone.emoji}</span>
                        <span className="text-sm font-semibold text-[var(--pp-text-primary)]">{tone.label}</span>
                      </div>
                      <p className="text-xs text-[var(--pp-text-muted)] leading-relaxed">{tone.description}</p>
                    </button>
                  ))}
                </div>

                {/* Live preview */}
                <div className="bg-[var(--pp-bg-deepest)] rounded-lg p-4 border border-[var(--pp-border-subtle)]">
                  <span className="label-meta text-[var(--pp-accent3)] text-[10px] mb-2 block">PREVIEW</span>
                  <p className="text-xs text-[var(--pp-text-secondary)] leading-relaxed italic">
                    &ldquo;{TONE_OPTIONS.find((t) => t.value === tonePreset)?.sample}&rdquo;
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Email Setup */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-lg font-semibold text-[var(--pp-text-primary)] mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  Set up your sending identity
                </h2>
                <p className="text-sm text-[var(--pp-text-muted)] mb-6">
                  Optional — you can configure email sending later in Settings.
                </p>

                <div className="space-y-4 flex-1">
                  <div>
                    <Label htmlFor="sender-name" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">
                      Sender name
                    </Label>
                    <Input
                      id="sender-name"
                      placeholder="e.g. Alex from Acme"
                      value={sendingName}
                      onChange={(e) => setSendingName(e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)] focus:ring-[var(--pp-accent1)]/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sender-email" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">
                      Sender email
                    </Label>
                    <Input
                      id="sender-email"
                      type="email"
                      placeholder="e.g. alex@acme.com"
                      value={sendingEmail}
                      onChange={(e) => setSendingEmail(e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)] focus:ring-[var(--pp-accent1)]/20"
                    />
                  </div>

                  <div className="bg-[var(--pp-bg-deepest)] rounded-lg p-4 border border-[var(--pp-border-subtle)]">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-[var(--pp-accent1)] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-[var(--pp-text-primary)] mb-1">Full SMTP & Gmail setup</p>
                        <p className="text-xs text-[var(--pp-text-muted)]">
                          You can connect Gmail OAuth or custom SMTP in Settings → Email Configuration after onboarding.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--pp-border-subtle)]">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] cursor-pointer disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {currentStep === 4 && (
                <Button
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  className="text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] cursor-pointer text-sm"
                >
                  Skip for now
                </Button>
              )}
              <Button
                onClick={nextStep}
                disabled={!canProceed() || isSubmitting}
                className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : null}
                {currentStep === 4 ? "Complete Setup" : "Continue"}
                {currentStep < 4 && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
