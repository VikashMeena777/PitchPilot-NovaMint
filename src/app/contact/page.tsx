"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, MessageSquare, Send, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    // Simulate form submission (wire to an actual API endpoint when ready)
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-[var(--pp-bg-deepest)] text-[var(--pp-text-primary)]">
      {/* Nav */}
      <nav className="border-b border-[var(--pp-border-subtle)]">
        <div className="glass-strong">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer group">
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
            <Button variant="ghost" asChild className="text-[var(--pp-text-secondary)] hover:text-[var(--pp-text-primary)] cursor-pointer">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <span className="label-meta text-[var(--pp-accent1-light)] mb-3 block">Contact Us</span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Get in <span className="gradient-text">touch</span>
          </h1>
          <p className="text-[var(--pp-text-secondary)] max-w-xl mx-auto text-lg">
            Have a question, feedback, or need help? We&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-2 space-y-4"
          >
            {[
              {
                icon: Mail,
                title: "Email Us",
                detail: "support@novamintnetworks.in",
                sub: "We reply within 24 hours",
                href: "mailto:support@novamintnetworks.in",
              },
              {
                icon: MessageSquare,
                title: "Live Chat",
                detail: "Available Mon–Fri",
                sub: "9 AM – 6 PM IST",
                href: undefined,
              },
              {
                icon: MapPin,
                title: "Office",
                detail: "Rajasthan, India",
                sub: "NovaMint Networks",
                href: undefined,
              },
              {
                icon: Clock,
                title: "Response Time",
                detail: "< 24 hours",
                sub: "Usually within a few hours",
                href: undefined,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className="group rounded-2xl p-5 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] card-hover"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--pp-accent1)]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[var(--pp-accent1-light)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--pp-text-primary)]">{item.title}</h3>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-[var(--pp-accent1-light)] hover:underline">
                          {item.detail}
                        </a>
                      ) : (
                        <p className="text-sm text-[var(--pp-text-secondary)]">{item.detail}</p>
                      )}
                      <p className="text-xs text-[var(--pp-text-muted)] mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="lg:col-span-3"
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 sm:p-8 bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--pp-text-muted)] mb-1.5 block">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-subtle)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--pp-text-muted)] mb-1.5 block">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-subtle)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--pp-text-muted)] mb-1.5 block">Subject</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="How can we help?"
                  className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-subtle)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--pp-text-muted)] mb-1.5 block">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us more..."
                  rows={5}
                  required
                  className="w-full rounded-md px-3 py-2 text-sm bg-[var(--pp-bg-deepest)] border border-[var(--pp-border-subtle)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pp-accent1)]/40 resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo transition-all duration-200"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Message
                  </span>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--pp-border-subtle)] py-8 bg-[var(--pp-bg-deepest)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--pp-text-muted)]">
            © {new Date().getFullYear()} PitchMint. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-[var(--pp-text-muted)]">
            <Link href="/terms" className="hover:text-[var(--pp-text-primary)] transition-colors cursor-pointer">Terms</Link>
            <Link href="/privacy" className="hover:text-[var(--pp-text-primary)] transition-colors cursor-pointer">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
