"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, Loader2, Building2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      if (!supabase) {
        setError("Supabase is not configured. Please set environment variables.");
        return;
      }
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
  }

  const fadeInStagger = {
    hidden: { opacity: 0, y: 12 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.07,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    }),
  };

  return (
    <>
      <motion.h1
        custom={0}
        initial="hidden"
        animate="show"
        variants={fadeInStagger}
        className="text-2xl font-bold tracking-tight text-center mb-1"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Start closing deals
      </motion.h1>
      <motion.p
        custom={1}
        initial="hidden"
        animate="show"
        variants={fadeInStagger}
        className="text-[var(--pp-text-secondary)] text-sm text-center mb-8"
      >
        Create your PitchPilot account — free to start
      </motion.p>

      {/* Google OAuth */}
      <motion.div custom={2} initial="hidden" animate="show" variants={fadeInStagger}>
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 gap-2 bg-transparent border-[var(--pp-border-default)] text-[var(--pp-text-primary)] hover:bg-[var(--pp-bg-surface2)] hover:border-[var(--pp-border-strong)] transition-all duration-200 cursor-pointer"
          onClick={handleGoogleSignup}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>
      </motion.div>

      {/* Divider */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="show"
        variants={fadeInStagger}
        className="relative my-6"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--pp-border-subtle)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-[var(--pp-bg-surface)] text-[var(--pp-text-muted)] label-meta">or</span>
        </div>
      </motion.div>

      {/* Registration Form */}
      <form onSubmit={handleSignup} className="space-y-4">
        {/* Full Name */}
        <motion.div custom={4} initial="hidden" animate="show" variants={fadeInStagger}>
          <Label htmlFor="signup-name" className="text-sm text-[var(--pp-text-secondary)] mb-1.5 block">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pp-text-muted)]" />
            <Input
              id="signup-name"
              type="text"
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="pl-10 h-11 bg-[var(--pp-bg-surface)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] input-glow transition-all duration-200"
            />
          </div>
        </motion.div>

        {/* Company Name */}
        <motion.div custom={5} initial="hidden" animate="show" variants={fadeInStagger}>
          <Label htmlFor="signup-company" className="text-sm text-[var(--pp-text-secondary)] mb-1.5 block">
            Company Name
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pp-text-muted)]" />
            <Input
              id="signup-company"
              type="text"
              placeholder="Acme Inc"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="pl-10 h-11 bg-[var(--pp-bg-surface)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] input-glow transition-all duration-200"
            />
          </div>
        </motion.div>

        {/* Email */}
        <motion.div custom={6} initial="hidden" animate="show" variants={fadeInStagger}>
          <Label htmlFor="signup-email" className="text-sm text-[var(--pp-text-secondary)] mb-1.5 block">
            Work Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pp-text-muted)]" />
            <Input
              id="signup-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 h-11 bg-[var(--pp-bg-surface)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] input-glow transition-all duration-200"
            />
          </div>
        </motion.div>

        {/* Password */}
        <motion.div custom={7} initial="hidden" animate="show" variants={fadeInStagger}>
          <Label htmlFor="signup-password" className="text-sm text-[var(--pp-text-secondary)] mb-1.5 block">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pp-text-muted)]" />
            <Input
              id="signup-password"
              type="password"
              placeholder="8+ characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="pl-10 h-11 bg-[var(--pp-bg-surface)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] input-glow transition-all duration-200"
            />
          </div>
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
          >
            {error}
          </motion.p>
        )}

        <motion.div custom={8} initial="hidden" animate="show" variants={fadeInStagger}>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold transition-all duration-200 cursor-pointer btn-hover glow-indigo hover:glow-indigo-strong"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </form>

      {/* Sign in link */}
      <motion.p
        custom={9}
        initial="hidden"
        animate="show"
        variants={fadeInStagger}
        className="text-center text-sm text-[var(--pp-text-secondary)] mt-6"
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--pp-accent1-light)] font-medium hover:underline cursor-pointer"
        >
          Sign in
        </Link>
      </motion.p>
    </>
  );
}
