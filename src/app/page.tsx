"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Mail,
  BarChart3,
  Shield,
  Brain,
  Target,
  Clock,
  TrendingUp,
  Check,
  ChevronDown,
  Star,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";


/* ━━━ FEATURE CARDS DATA ━━━ */
const features = [
  {
    icon: Brain,
    title: "AI-Powered Research",
    description: "Automatically research prospects — company info, recent posts, tech stack, and pain points. Every email is personalized with real data.",
    accent: "var(--pp-accent1)",
    glow: "var(--pp-glow-indigo)",
  },
  {
    icon: Mail,
    title: "Hyper-Personalized Emails",
    description: "Generate unique cold emails for every prospect using AI. No templates, no spam — just genuine, human-sounding outreach.",
    accent: "var(--pp-accent4)",
    glow: "var(--pp-glow-pink)",
  },
  {
    icon: Zap,
    title: "Automated Sequences",
    description: "Build multi-step follow-up sequences with intelligent timing. Automatically stop when a prospect replies.",
    accent: "var(--pp-accent2)",
    glow: "var(--pp-glow-emerald)",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track opens, clicks, replies, and meetings booked. Know exactly which messages resonate and which need tweaking.",
    accent: "var(--pp-accent3)",
    glow: "var(--pp-glow-amber)",
  },
  {
    icon: Shield,
    title: "Deliverability Engine",
    description: "Smart send-time optimization, throttling, and warm-up. Land in the inbox, not spam. Built-in domain health monitoring.",
    accent: "var(--pp-accent1)",
    glow: "var(--pp-glow-indigo)",
  },
  {
    icon: Target,
    title: "Smart Reply Detection",
    description: "AI categorizes replies — interested, not interested, out of office, wrong person. Auto-sort and prioritize hot leads.",
    accent: "var(--pp-accent2)",
    glow: "var(--pp-glow-emerald)",
  },
];

/* ━━━ PRICING ━━━ */
const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try PitchPilot with limited features",
    features: [
      "25 prospects/month",
      "1 active sequence",
      "AI email generation",
      "Basic analytics",
      "Email tracking",
    ],
    cta: "Get Started Free",
    featured: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/month",
    description: "For serious sales teams scaling outreach",
    features: [
      "1,000 prospects/month",
      "10 active sequences",
      "AI research + personalization",
      "Advanced analytics & reports",
      "CSV import + API access",
      "Custom sending schedules",
      "Priority support",
    ],
    cta: "Start 14-Day Trial",
    featured: true,
  },
  {
    name: "Agency",
    price: "$149",
    period: "/month",
    description: "Unlimited outreach for agencies & teams",
    features: [
      "Unlimited prospects",
      "Unlimited sequences",
      "Full AI engine access",
      "Team collaboration",
      "White-label reports",
      "API + webhooks",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

/* ━━━ FAQ ━━━ */
const faqs = [
  {
    q: "How does the AI personalization work?",
    a: "PitchPilot researches each prospect — their company website, recent social posts, tech stack, and news mentions. The AI then uses these insights to craft a unique email that references specific details about the prospect, making every message feel handwritten.",
  },
  {
    q: "Will my emails land in spam?",
    a: "Our deliverability engine includes smart throttling, send-time optimization, and domain health monitoring. We follow best practices for email authentication (SPF, DKIM, DMARC) and provide warm-up guidance.",
  },
  {
    q: "Can I use my own email account?",
    a: "Yes — PitchPilot connects to your Gmail or any SMTP email provider. Emails are sent from YOUR email address, maintaining your sender reputation.",
  },
  {
    q: "What happens when a prospect replies?",
    a: "PitchPilot automatically detects replies and pauses the sequence for that prospect. Our AI categorizes the reply (interested, not interested, out of office, etc.) so you can prioritize hot leads.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! Our free plan includes 25 prospects per month, 1 active sequence, and full AI email generation. No credit card required to get started.",
  },
];

/* ━━━ SCROLL ANIMATION HOOK ━━━ */
function AnimateOnScroll({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const heroRef = useRef(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[var(--pp-bg-deepest)] text-[var(--pp-text-primary)] noise overflow-hidden">
      {/* ━━━ NAVIGATION ━━━ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 inset-x-0 z-50 border-b border-[var(--pp-border-subtle)]"
      >
        <div className="glass-strong">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--pp-accent1)] to-[var(--pp-accent4)] flex items-center justify-center shadow-md glow-indigo transition-transform duration-200 group-hover:scale-105">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                PitchPilot
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-[var(--pp-text-secondary)] hover:text-[var(--pp-text-primary)] transition-colors duration-200 cursor-pointer">Features</a>
              <a href="#pricing" className="text-sm text-[var(--pp-text-secondary)] hover:text-[var(--pp-text-primary)] transition-colors duration-200 cursor-pointer">Pricing</a>
              <a href="#faq" className="text-sm text-[var(--pp-text-secondary)] hover:text-[var(--pp-text-primary)] transition-colors duration-200 cursor-pointer">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Button asChild className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo transition-all duration-200 text-sm">
                  <Link href="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-[var(--pp-text-secondary)] hover:text-[var(--pp-text-primary)] cursor-pointer hidden sm:flex">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo transition-all duration-200 text-sm">
                    <Link href="/signup">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ━━━ HERO ━━━ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 aurora-bg"
      >
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--pp-accent1)]/10 border border-[var(--pp-border-accent)] mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--pp-accent1-light)]" />
            <span className="label-meta text-[var(--pp-accent1-light)]">AI-Powered Sales Outreach</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="block">Your AI Sales Rep</span>
            <span className="gradient-text-shimmer">That Works 24/7</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-lg sm:text-xl text-[var(--pp-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            PitchPilot researches your prospects, writes hyper-personalized cold emails,
            and sends automated follow-up sequences.{" "}
            <span className="text-[var(--pp-text-primary)] font-medium">Book more meetings on autopilot.</span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              asChild
              size="lg"
              className="h-13 px-8 bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold text-base cursor-pointer btn-hover glow-indigo-strong transition-all duration-200"
            >
              <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
                {isLoggedIn ? (
                  <>
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </>
                ) : (
                  <>
                    Start Free — No Card Required
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-13 px-8 bg-transparent border-[var(--pp-border-default)] text-[var(--pp-text-primary)] hover:bg-[var(--pp-bg-surface2)] hover:border-[var(--pp-border-strong)] cursor-pointer transition-all duration-200 text-base"
            >
              <a href="#features">
                See How It Works
                <ChevronDown className="w-4 h-4 ml-1" />
              </a>
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[var(--pp-text-muted)]"
          >
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-[var(--pp-accent3)] text-[var(--pp-accent3)]" />
              ))}
              <span className="ml-2">5.0 from early adopters</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-[var(--pp-border-subtle)]" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Takes 2 minutes to set up</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-[var(--pp-border-subtle)]" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>SOC 2 compliant</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ━━━ FEATURES ━━━ */}
      <section id="features" className="py-24 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll className="text-center mb-16">
            <span className="label-meta text-[var(--pp-accent1-light)] mb-3 block">Features</span>
            <h2 className="mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Everything you need to{" "}
              <span className="gradient-text">close more deals</span>
            </h2>
            <p className="text-[var(--pp-text-secondary)] max-w-2xl mx-auto text-lg">
              From prospect research to reply detection — PitchPilot handles the entire cold outreach pipeline so you can focus on closing.
            </p>
          </AnimateOnScroll>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <AnimateOnScroll key={feature.title} delay={i * 0.08}>
                  <div className="group relative rounded-2xl p-6 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] card-hover h-full overflow-hidden">
                    {/* Glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${feature.glow}, transparent 70%)`,
                      }}
                    />
                    <div className="relative z-10">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: `color-mix(in srgb, ${feature.accent} 12%, transparent)` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: feature.accent }} />
                      </div>
                      <h3
                        className="text-lg font-semibold text-[var(--pp-text-primary)] mb-2"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {feature.title}
                      </h3>
                      <p className="text-sm text-[var(--pp-text-secondary)] leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="py-24 sm:py-32 relative border-t border-[var(--pp-border-subtle)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll className="text-center mb-16">
            <span className="label-meta text-[var(--pp-accent2-light)] mb-3 block">How It Works</span>
            <h2 className="mb-4" style={{ fontFamily: "var(--font-display)" }}>
              From zero to booked meetings in{" "}
              <span className="text-[var(--pp-accent2-light)]">3 steps</span>
            </h2>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Prospects",
                description: "Import a CSV or add prospects one by one. Include their email, name, company, and LinkedIn — we'll do the rest.",
                icon: Users,
              },
              {
                step: "02",
                title: "AI Writes Emails",
                description: "PitchPilot researches each prospect and generates a unique, personalized email that references their specific situation.",
                icon: Brain,
              },
              {
                step: "03",
                title: "Autopilot Outreach",
                description: "Set up your sequence and let PitchPilot send emails, follow up, and notify you the moment a prospect replies.",
                icon: TrendingUp,
              },
            ].map((step, i) => (
              <AnimateOnScroll key={step.step} delay={i * 0.12} className="relative">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--pp-accent1)]/15 to-[var(--pp-accent4)]/10 border border-[var(--pp-border-accent)] mb-5">
                    <step.icon className="w-7 h-7 text-[var(--pp-accent1-light)]" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--pp-accent1)] text-white text-xs font-bold flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--pp-text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-px bg-gradient-to-r from-[var(--pp-accent1)]/40 to-transparent" />
                )}
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING ━━━ */}
      <section id="pricing" className="py-24 sm:py-32 relative border-t border-[var(--pp-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll className="text-center mb-16">
            <span className="label-meta text-[var(--pp-accent3)] mb-3 block">Pricing</span>
            <h2 className="mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Simple, transparent pricing
            </h2>
            <p className="text-[var(--pp-text-secondary)] max-w-xl mx-auto">
              Start free, scale as you grow. No hidden fees, no long-term contracts.
            </p>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <AnimateOnScroll key={plan.name} delay={i * 0.1}>
                <div
                  className={`relative rounded-2xl p-6 ${
                    plan.featured
                      ? "bg-gradient-to-b from-[var(--pp-accent1)]/10 via-[var(--pp-bg-surface)] to-[var(--pp-bg-surface)] border-2 border-[var(--pp-accent1)]/40 glow-indigo"
                      : "bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)]"
                  } flex flex-col h-full`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-[var(--pp-accent1)] text-white text-xs font-semibold label-meta">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3
                      className="text-lg font-semibold text-[var(--pp-text-primary)] mb-1"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {plan.name}
                    </h3>
                    <p className="text-sm text-[var(--pp-text-muted)]">{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                      {plan.price}
                    </span>
                    <span className="text-sm text-[var(--pp-text-muted)] ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[var(--pp-text-secondary)]">
                        <Check className="w-4 h-4 mt-0.5 text-[var(--pp-accent2)] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full cursor-pointer btn-hover transition-all duration-200 ${
                      plan.featured
                        ? "bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold glow-indigo hover:glow-indigo-strong"
                        : "bg-[var(--pp-bg-surface2)] text-[var(--pp-text-primary)] border border-[var(--pp-border-default)] hover:bg-[var(--pp-bg-elevated)]"
                    }`}
                  >
                    <Link href="/signup">{plan.cta}</Link>
                  </Button>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FAQ ━━━ */}
      <section id="faq" className="py-24 sm:py-32 relative border-t border-[var(--pp-border-subtle)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll className="text-center mb-16">
            <span className="label-meta text-[var(--pp-accent4)] mb-3 block">FAQ</span>
            <h2 style={{ fontFamily: "var(--font-display)" }}>
              Got questions?
            </h2>
          </AnimateOnScroll>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <AnimateOnScroll key={i} delay={i * 0.06}>
                <details className="group rounded-2xl bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] overflow-hidden transition-all duration-200 hover:border-[var(--pp-border-default)]">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none text-[var(--pp-text-primary)] font-medium">
                    {faq.q}
                    <ChevronDown className="w-5 h-5 text-[var(--pp-text-muted)] transition-transform duration-300 group-open:rotate-180 flex-shrink-0 ml-4" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-[var(--pp-text-secondary)] leading-relaxed border-t border-[var(--pp-border-subtle)] pt-4">
                    {faq.a}
                  </div>
                </details>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ CTA SECTION ━━━ */}
      <section className="py-24 relative overflow-hidden border-t border-[var(--pp-border-subtle)]">
        <div className="absolute inset-0 aurora-bg" />
        <AnimateOnScroll className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Ready to automate your{" "}
            <span className="gradient-text">sales outreach?</span>
          </h2>
          <p className="text-lg text-[var(--pp-text-secondary)] mb-10 max-w-xl mx-auto">
            Join hundreds of sales teams using PitchPilot to book more meetings with less effort.
          </p>
          <Button
            asChild
            size="lg"
            className="h-13 px-10 bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold text-base cursor-pointer btn-hover glow-indigo-strong transition-all duration-200"
          >
            <Link href="/signup">
              Start Free Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </AnimateOnScroll>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-[var(--pp-border-subtle)] py-12 bg-[var(--pp-bg-deepest)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--pp-accent1)] to-[var(--pp-accent4)] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </div>
              <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>PitchPilot</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-[var(--pp-text-muted)]">
              <Link href="/terms" className="hover:text-[var(--pp-text-primary)] transition-colors cursor-pointer">Terms</Link>
              <Link href="/privacy" className="hover:text-[var(--pp-text-primary)] transition-colors cursor-pointer">Privacy</Link>
              <Link href="/contact" className="hover:text-[var(--pp-text-primary)] transition-colors cursor-pointer">Contact</Link>
            </div>
            <p className="text-xs text-[var(--pp-text-muted)]">
              © {new Date().getFullYear()} PitchPilot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
