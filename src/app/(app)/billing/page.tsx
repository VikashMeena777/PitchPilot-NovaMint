"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId, type PlanDetails } from "@/lib/billing/plans";
import {
  CreditCard,
  Check,
  Sparkles,
  Loader2,
  Crown,
  Zap,
  Building2,
  Rocket,
  ArrowRight,
  Shield,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const PLAN_ICONS: Record<PlanId, typeof Rocket> = {
  free: Zap,
  starter: Rocket,
  growth: Crown,
  agency: Building2,
};

const PLAN_GRADIENTS: Record<PlanId, string> = {
  free: "from-gray-500/20 to-gray-600/10",
  starter: "from-[var(--pp-accent1)]/20 to-[var(--pp-accent2)]/10",
  growth: "from-[var(--pp-accent2)]/20 to-[var(--pp-accent3)]/10",
  agency: "from-[var(--pp-accent3)]/20 to-amber-500/10",
};

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--pp-text-tertiary)]">Loading billing...</div>}>
      <BillingPageContent />
    </Suspense>
  );
}

function BillingPageContent() {
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Check for return from Cashfree checkout
  useEffect(() => {
    const status = searchParams.get("status");
    const plan = searchParams.get("plan");
    if (status === "success" && plan) {
      toast.success(`Welcome to ${PLANS[plan as PlanId]?.name || plan}!`, {
        description: "Your subscription is being activated...",
      });
    }
  }, [searchParams]);

  // Fetch current subscription
  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/billing/manage");
      if (res.ok) {
        const data = await res.json();
        setCurrentPlan(data.plan || "free");
        setSubscriptionId(data.subscriptionId);
        setExpiresAt(data.expiresAt);
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpgrade(planId: PlanId) {
    if (planId === "free" || planId === currentPlan) return;

    setUpgradingPlan(planId);
    try {
      const res = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (data.authLink) {
        window.location.href = data.authLink;
      } else {
        toast.error(data.error || "Failed to create subscription");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUpgradingPlan(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription? You'll be downgraded to the Free plan.")) return;

    setIsCancelling(true);
    try {
      const res = await fetch("/api/billing/manage", { method: "POST" });
      if (res.ok) {
        toast.success("Subscription cancelled. You're now on the Free plan.");
        setCurrentPlan("free");
        setSubscriptionId(null);
        setExpiresAt(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel subscription");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsCancelling(false);
    }
  }

  const planOrder: PlanId[] = ["free", "starter", "growth", "agency"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 p-6 md:p-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-[var(--pp-text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Billing & Plans
        </h1>
        <p className="text-sm text-[var(--pp-text-secondary)] mt-1">
          Manage your subscription and unlock more power
        </p>
      </div>

      {/* Current Plan Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-[var(--pp-border-subtle)] bg-gradient-to-br from-[var(--pp-bg-surface)] to-[var(--pp-accent1)]/5 p-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--pp-accent1)]/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-[var(--pp-accent1)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--pp-text-tertiary)] uppercase tracking-wider font-medium">
                Current Plan
              </p>
              <p className="text-xl font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                  </span>
                ) : (
                  PLANS[currentPlan as PlanId]?.name || "Free"
                )}
              </p>
              {expiresAt && (
                <p className="text-xs text-[var(--pp-text-tertiary)] mt-1">
                  Renews on {new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
          {currentPlan !== "free" && subscriptionId && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isCancelling}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
            >
              {isCancelling ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Cancel Subscription
            </Button>
          )}
        </div>

        {/* Decorative gradient orb */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--pp-accent1)]/5 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {planOrder.map((planId, i) => {
          const plan = PLANS[planId];
          const Icon = PLAN_ICONS[planId];
          const isCurrentPlan = currentPlan === planId;
          const isUpgrade = planOrder.indexOf(planId) > planOrder.indexOf(currentPlan as PlanId);

          return (
            <PlanCard
              key={planId}
              plan={plan}
              icon={Icon}
              gradient={PLAN_GRADIENTS[planId]}
              isCurrentPlan={isCurrentPlan}
              isUpgrade={isUpgrade}
              isUpgrading={upgradingPlan === planId}
              onUpgrade={() => handleUpgrade(planId)}
              delay={i * 0.08}
            />
          );
        })}
      </div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex flex-wrap items-center justify-center gap-6 pt-4 pb-2"
      >
        {[
          { icon: Shield, text: "Secure Payments via Cashfree" },
          { icon: Star, text: "Cancel Anytime" },
          { icon: Sparkles, text: "7-Day Free Trial on Starter" },
        ].map((badge, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-[var(--pp-text-tertiary)]">
            <badge.icon className="w-3.5 h-3.5 text-[var(--pp-accent1)]/60" />
            {badge.text}
          </div>
        ))}
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="max-w-2xl mx-auto space-y-4 pt-4"
      >
        <h2
          className="text-lg font-semibold text-[var(--pp-text-primary)] text-center"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Frequently Asked Questions
        </h2>
        {[
          {
            q: "Can I change plans later?",
            a: "Yes! You can upgrade or downgrade anytime. Changes take effect immediately.",
          },
          {
            q: "What happens when I hit my limit?",
            a: "You'll be notified and can upgrade. Existing sequences will pause until limits are resolved.",
          },
          {
            q: "Is there a refund policy?",
            a: "We offer a full refund within 48 hours of your first payment if you're not satisfied.",
          },
          {
            q: "Do you support UPI, cards, and net banking?",
            a: "Yes, all payment methods supported by Cashfree are available — UPI, credit/debit cards, net banking, and wallets.",
          },
        ].map((faq, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)]"
          >
            <p className="text-sm font-medium text-[var(--pp-text-primary)]">{faq.q}</p>
            <p className="text-xs text-[var(--pp-text-secondary)] mt-1">{faq.a}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Plan Card Component
// ============================================
function PlanCard({
  plan,
  icon: Icon,
  gradient,
  isCurrentPlan,
  isUpgrade,
  isUpgrading,
  onUpgrade,
  delay,
}: {
  plan: PlanDetails;
  icon: typeof Rocket;
  gradient: string;
  isCurrentPlan: boolean;
  isUpgrade: boolean;
  isUpgrading: boolean;
  onUpgrade: () => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 ${
        plan.popular
          ? "border-[var(--pp-accent1)]/40 shadow-lg shadow-[var(--pp-accent1)]/5"
          : "border-[var(--pp-border-subtle)]"
      } ${isCurrentPlan ? "ring-2 ring-[var(--pp-accent1)]/30" : ""} bg-[var(--pp-bg-surface)]`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent2)] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Most Popular
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`p-5 bg-gradient-to-br ${gradient}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--pp-bg-base)]/50 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-[var(--pp-text-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
              {plan.name}
            </h3>
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          {plan.price === 0 ? (
            <span className="text-3xl font-black text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
              Free
            </span>
          ) : (
            <>
              <span className="text-xs text-[var(--pp-text-secondary)]">₹</span>
              <span className="text-3xl font-black text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                {plan.price}
              </span>
              <span className="text-xs text-[var(--pp-text-tertiary)]">/month</span>
            </>
          )}
        </div>

        {plan.trialDays > 0 && (
          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--pp-accent1)] bg-[var(--pp-accent1)]/10 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" /> {plan.trialDays}-day free trial
          </div>
        )}

        <p className="text-xs text-[var(--pp-text-secondary)] mt-2 line-clamp-2">
          {plan.description}
        </p>
      </div>

      {/* Features */}
      <div className="p-5 flex-1 space-y-2.5">
        {plan.features.map((feature, j) => (
          <div key={j} className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-[var(--pp-accent1)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 text-[var(--pp-accent1)]" />
            </div>
            <span className="text-xs text-[var(--pp-text-secondary)] leading-relaxed">
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-5 pt-0">
        {isCurrentPlan ? (
          <Button
            disabled
            className="w-full bg-[var(--pp-bg-elevated)] text-[var(--pp-text-tertiary)] cursor-default"
          >
            <Check className="w-4 h-4 mr-1" /> Current Plan
          </Button>
        ) : plan.price === 0 ? (
          <Button
            disabled
            variant="outline"
            className="w-full border-[var(--pp-border-subtle)] text-[var(--pp-text-tertiary)] cursor-default"
          >
            Free Forever
          </Button>
        ) : isUpgrade ? (
          <Button
            onClick={onUpgrade}
            disabled={isUpgrading}
            className={`w-full cursor-pointer font-semibold transition-all duration-300 ${
              plan.popular
                ? "bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white glow-indigo btn-hover"
                : "bg-[var(--pp-accent1)]/10 text-[var(--pp-accent1)] hover:bg-[var(--pp-accent1)]/20"
            }`}
          >
            {isUpgrading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-1" />
            )}
            {plan.trialDays > 0 ? "Start Free Trial" : "Upgrade"}
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled
            className="w-full border-[var(--pp-border-subtle)] text-[var(--pp-text-tertiary)] cursor-default"
          >
            Downgrade
          </Button>
        )}
      </div>
    </motion.div>
  );
}
