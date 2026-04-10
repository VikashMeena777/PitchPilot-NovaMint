"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ━━━ AURORA BACKGROUND ━━━ */}
      <div className="fixed inset-0 bg-[var(--pp-bg-deepest)]">
        {/* Orb blobs */}
        <div
          className="orb orb-indigo"
          style={{ width: 600, height: 600, top: "-15%", left: "-10%" }}
        />
        <div
          className="orb orb-violet"
          style={{ width: 500, height: 500, bottom: "-10%", right: "-8%" }}
        />
        <div
          className="orb orb-cyan"
          style={{ width: 400, height: 400, top: "40%", right: "20%" }}
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern" />
      </div>

      {/* ━━━ CONTENT ━━━ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 cursor-pointer group">
          <Image
            src="/PitchMint Logo.jpg"
            alt="PitchMint"
            width={40}
            height={40}
            className="rounded-xl shadow-lg transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-xl font-bold tracking-tight text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            PitchMint
          </span>
        </Link>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-[var(--pp-text-muted)] text-xs mt-6">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-[var(--pp-accent1-light)] hover:underline cursor-pointer">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-[var(--pp-accent1-light)] hover:underline cursor-pointer">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}
