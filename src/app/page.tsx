"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { AuroraBackground } from "@/components/ui/aurora-background";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Typewriter } from "@/components/ui/typewriter";

/* Typewriter phrases for hero section */
const heroTypewriterWords = [
  "That Works 24/7",
  "That Never Sleeps",
  "That Books Meetings",
  "That Closes Deals",
  "That Scales Outreach",
];


/* ━━━ FEATURE CARDS DATA ━━━ */
const features = [
  {
    icon: Brain,
    title: "AI-Powered Research",
    description: "Automatically research prospects — company info, recent posts, tech stack, and pain points. Every email is personalized with real data.",
    accent: "var(--pp-accent1)",
    gradient: "from-[var(--pp-accent1)]/15 to-[var(--pp-accent1)]/5",
  },
  {
    icon: Mail,
    title: "Hyper-Personalized Emails",
    description: "Generate unique cold emails for every prospect using AI. No templates, no spam — just genuine, human-sounding outreach.",
    accent: "var(--pp-accent4)",
    gradient: "from-[var(--pp-accent4)]/15 to-[var(--pp-accent4)]/5",
  },
  {
    icon: Zap,
    title: "Automated Sequences",
    description: "Build multi-step follow-up sequences with intelligent timing. Automatically stop when a prospect replies.",
    accent: "var(--pp-accent2)",
    gradient: "from-[var(--pp-accent2)]/15 to-[var(--pp-accent2)]/5",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track opens, clicks, replies, and meetings booked. Know exactly which messages resonate and which need tweaking.",
    accent: "var(--pp-accent3)",
    gradient: "from-[var(--pp-accent3)]/15 to-[var(--pp-accent3)]/5",
  },
  {
    icon: Shield,
    title: "Deliverability Engine",
    description: "Smart send-time optimization, throttling, and warm-up. Land in the inbox, not spam. Built-in domain health monitoring.",
    accent: "var(--pp-accent1)",
    gradient: "from-[var(--pp-accent1)]/15 to-[var(--pp-accent1)]/5",
  },
  {
    icon: Target,
    title: "Smart Reply Detection",
    description: "AI categorizes replies — interested, not interested, out of office, wrong person. Auto-sort and prioritize hot leads.",
    accent: "var(--pp-accent2)",
    gradient: "from-[var(--pp-accent2)]/15 to-[var(--pp-accent2)]/5",
  },
];

/* ━━━ PRICING ━━━ */
const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try PitchMint with limited features",
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
    a: "PitchMint researches each prospect — their company website, recent social posts, tech stack, and news mentions. The AI then uses these insights to craft a unique email that references specific details about the prospect, making every message feel handwritten.",
  },
  {
    q: "Will my emails land in spam?",
    a: "Our deliverability engine includes smart throttling, send-time optimization, and domain health monitoring. We follow best practices for email authentication (SPF, DKIM, DMARC) and provide warm-up guidance.",
  },
  {
    q: "Can I use my own email account?",
    a: "Yes — PitchMint connects to your Gmail or any SMTP email provider. Emails are sent from YOUR email address, maintaining your sender reputation.",
  },
  {
    q: "What happens when a prospect replies?",
    a: "PitchMint automatically detects replies and pauses the sequence for that prospect. Our AI categorizes the reply (interested, not interested, out of office, etc.) so you can prioritize hot leads.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! Our free plan includes 25 prospects per month, 1 active sequence, and full AI email generation. No credit card required to get started.",
  },
];

/* ━━━ SOCIAL PROOF STATS ━━━ */
const socialStats = [
  { value: 500, suffix: "+", label: "Users" },
  { value: 50, suffix: "K+", label: "Emails Sent" },
  { value: 98, suffix: "%", label: "Deliverability" },
  { value: 4.8, suffix: "★", label: "Rating" },
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
    <div className="min-h-screen bg-[var(--pp-bg-deepest)] text-[var(--pp-text-primary)] overflow-x-hidden">
      {/* ━━━ NAVIGATION ━━━ */}
      <motion.nav
        initial={{ opacity: 0, y: -20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 inset-x-0 z-50 border-b border-[var(--pp-border-subtle)]"
      >
        <div className="glass-strong">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
              <Image
                src="/PitchMint Logo.jpg"
                alt="PitchMint"
                width={36}
                height={36}
                className="rounded-xl flex-shrink-0 shadow-md transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                PitchMint
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-[var(--pp-text-secondary)] hover:text-[var(--pp-text-primary)] transition-colors duration-200 cursor-pointer">Features</a>
              <a href="#pricing" className="text-sm font-medium text-[var(--pp-text-secondary)] hover:text-[var(--pp-text-primary)] transition-colors duration-200 cursor-pointer">Pricing</a>
              <a href="#faq" className="text-sm font-medium text-[var(--pp-text-secondary)] hover:text-[var(--pp-text-primary)] transition-colors duration-200 cursor-pointer">FAQ</a>
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
        className="relative"
      >
        <AuroraBackground className="pt-32 pb-20 sm:pt-44 sm:pb-36">

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--pp-accent1)]/8 border border-[var(--pp-border-accent)] mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--pp-accent2-light)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--pp-accent2-light)]" />
              </span>
              <span className="label-meta text-[var(--pp-accent1-light)]">AI-Powered Sales Outreach</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="block text-gradient-hero">Your AI Sales Rep</span>
              <span className="block text-gradient-hero">
                <Typewriter
                  words={heroTypewriterWords}
                  typingSpeed={70}
                  deletingSpeed={45}
                  pauseDuration={2500}
                  className="text-gradient-hero"
                />
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="text-lg sm:text-xl text-[var(--pp-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              PitchMint researches your prospects, writes hyper-personalized cold emails,
              and sends automated follow-up sequences.{" "}
              <span className="text-[var(--pp-text-primary)] font-medium">Book more meetings on autopilot.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                asChild
                size="lg"
                className="h-13 px-8 bg-gradient-to-b from-white via-white/95 to-white/70 text-[#020617] font-semibold text-base cursor-pointer btn-hover transition-all duration-200 hover:shadow-[0_0_40px_rgba(255,255,255,0.18)]"
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

            {/* Social proof text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.1 }}
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
        </AuroraBackground>
      </motion.section>

      {/* ━━━ ANIMATED STATS BAR ━━━ */}
      <section className="relative py-12 border-y border-[var(--pp-border-subtle)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {socialStats.map((stat, i) => (
              <AnimateOnScroll key={stat.label} delay={i * 0.1} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[var(--pp-text-primary)]">
                  {Number.isInteger(stat.value) ? (
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} className="text-3xl sm:text-4xl font-bold" />
                  ) : (
                    <span className="stat-number">{stat.value}{stat.suffix}</span>
                  )}
                </div>
                <p className="text-xs text-[var(--pp-text-muted)] mt-1 uppercase tracking-wider">{stat.label}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section id="features" className="py-24 sm:py-32 relative">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <AnimateOnScroll className="text-center mb-16">
            <span className="label-meta text-[var(--pp-accent1-light)] mb-3 block">Features</span>
            <h2 className="mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Everything you need to{" "}
              <span className="gradient-text">close more deals</span>
            </h2>
            <p className="text-[var(--pp-text-secondary)] max-w-2xl mx-auto text-lg">
              From prospect research to reply detection — PitchMint handles the entire cold outreach pipeline so you can focus on closing.
            </p>
          </AnimateOnScroll>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <AnimateOnScroll key={feature.title} delay={i * 0.08}>
                  <div className="group relative rounded-2xl p-6 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] card-hover card-spotlight card-top-accent h-full overflow-hidden"
                    style={{ "--accent-gradient": `linear-gradient(90deg, ${feature.accent}, transparent)` } as React.CSSProperties}
                  >
                    {/* Glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${feature.accent} 12%, transparent), transparent 70%)`,
                      }}
                    />
                    <div className="relative z-10">
                      <div
                        className={`icon-container icon-container-lg mb-5 bg-gradient-to-br ${feature.gradient}`}
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
      <section className="py-24 sm:py-32 relative">
        <div className="section-divider" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24">
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
                accent: "var(--pp-accent1)",
              },
              {
                step: "02",
                title: "AI Writes Emails",
                description: "PitchMint researches each prospect and generates a unique, personalized email that references their specific situation.",
                icon: Brain,
                accent: "var(--pp-accent2)",
              },
              {
                step: "03",
                title: "Autopilot Outreach",
                description: "Set up your sequence and let PitchMint send emails, follow up, and notify you the moment a prospect replies.",
                icon: TrendingUp,
                accent: "var(--pp-accent3)",
              },
            ].map((step, i) => (
              <AnimateOnScroll key={step.step} delay={i * 0.12} className="relative">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="icon-container icon-container-lg bg-gradient-to-br from-[var(--pp-accent1)]/12 to-[var(--pp-accent4)]/8 border border-[var(--pp-border-accent)] mb-5">
                      <step.icon className="w-7 h-7 text-[var(--pp-accent1-light)]" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-[var(--pp-accent1)] to-[var(--pp-accent2)] text-white text-xs font-bold flex items-center justify-center shadow-md">
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
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-px bg-gradient-to-r from-[var(--pp-accent1)]/30 to-transparent" />
                )}
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING ━━━ */}
      <section id="pricing" className="py-24 sm:py-32 relative">
        <div className="section-divider" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24">
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
                  className={`relative rounded-2xl p-6 card-spotlight ${
                    plan.featured
                      ? "bg-gradient-to-b from-[var(--pp-accent1)]/8 via-[var(--pp-bg-surface)] to-[var(--pp-bg-surface)] border-2 border-[var(--pp-accent1)]/30 glow-indigo"
                      : "bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] card-hover"
                  } flex flex-col h-full`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent2)] text-white text-xs font-semibold label-meta shadow-md">
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
                    <span className="text-4xl font-bold text-[var(--pp-text-primary)] stat-number" style={{ fontFamily: "var(--font-display)" }}>
                      {plan.price}
                    </span>
                    <span className="text-sm text-[var(--pp-text-muted)] ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--pp-text-secondary)]">
                        <div className="w-5 h-5 rounded-full bg-[var(--pp-accent1)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[var(--pp-accent1-light)]" />
                        </div>
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
      <section id="faq" className="py-24 sm:py-32 relative">
        <div className="section-divider" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24">
          <AnimateOnScroll className="text-center mb-16">
            <span className="label-meta text-[var(--pp-accent4)] mb-3 block">FAQ</span>
            <h2 style={{ fontFamily: "var(--font-display)" }}>
              Got questions?
            </h2>
          </AnimateOnScroll>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <AnimateOnScroll key={i} delay={i * 0.06}>
                <details className="group rounded-2xl bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] overflow-hidden transition-all duration-300 hover:border-[var(--pp-border-default)]">
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
      <section className="relative overflow-hidden">
        <div className="section-divider" />
        <AuroraBackground className="py-24" intensity={0.7} starCount={25}>
          <AnimateOnScroll className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center pt-24">
            <h2 className="mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Ready to automate your{" "}
              <span className="gradient-text">sales outreach?</span>
            </h2>
            <p className="text-lg text-[var(--pp-text-secondary)] mb-10 max-w-xl mx-auto">
              Join hundreds of sales teams using PitchMint to book more meetings with less effort.
            </p>
            <Button
              asChild
              size="lg"
              className="h-13 px-10 bg-gradient-to-b from-white via-white/95 to-white/70 text-[#020617] font-semibold text-base cursor-pointer btn-hover transition-all duration-200 hover:shadow-[0_0_40px_rgba(255,255,255,0.18)]"
            >
              <Link href="/signup">
                Start Free Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </AnimateOnScroll>
        </AuroraBackground>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-[var(--pp-border-subtle)] py-10 bg-[var(--pp-bg-deepest)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <Link href="/" className="flex items-center gap-2 cursor-pointer group">
              <Image
                src="/PitchMint Logo.jpg"
                alt="PitchMint"
                width={28}
                height={28}
                className="rounded-lg transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-sm font-bold text-[var(--pp-text-secondary)]" style={{ fontFamily: "var(--font-display)" }}>PitchMint</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-[var(--pp-text-muted)]">
              <Link href="/terms" className="hover:text-[var(--pp-text-secondary)] transition-colors cursor-pointer">Terms</Link>
              <Link href="/privacy" className="hover:text-[var(--pp-text-secondary)] transition-colors cursor-pointer">Privacy</Link>
              <Link href="/contact" className="hover:text-[var(--pp-text-secondary)] transition-colors cursor-pointer">Contact</Link>
            </div>
            <p className="text-xs text-[var(--pp-text-muted)]/60">
              © {new Date().getFullYear()} PitchMint. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
