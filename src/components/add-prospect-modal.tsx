"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addProspect, type ProspectFormData } from "@/lib/actions/prospects";
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  Link2,
  Globe,
  MapPin,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddProspectModal({ isOpen, onClose, onSuccess }: AddProspectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<ProspectFormData>({
    email: "",
    first_name: "",
    last_name: "",
    company_name: "",
    job_title: "",
    linkedin_url: "",
    website_url: "",
    phone: "",
    location: "",
    industry: "",
    company_size: "",
    notes: "",
  });

  const updateField = (field: keyof ProspectFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) {
      setError("Email is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await addProspect(form);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({
          email: "", first_name: "", last_name: "", company_name: "",
          job_title: "", linkedin_url: "", website_url: "", phone: "",
          location: "", industry: "", company_size: "", notes: "",
        });
        onSuccess?.();
        onClose();
      }, 1200);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-strong rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--pp-border-subtle)]">
                <div>
                  <h2 className="text-lg font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                    Add Prospect
                  </h2>
                  <p className="text-xs text-[var(--pp-text-muted)] mt-0.5">Add a new contact to your outreach pipeline</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Email (required) */}
                <div>
                  <Label htmlFor="prospect-email" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email *
                  </Label>
                  <Input
                    id="prospect-email"
                    type="email"
                    required
                    placeholder="prospect@company.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]"
                  />
                </div>

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="p-first" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> First name
                    </Label>
                    <Input id="p-first" placeholder="John" value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]" />
                  </div>
                  <div>
                    <Label htmlFor="p-last" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Last name</Label>
                    <Input id="p-last" placeholder="Doe" value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]" />
                  </div>
                </div>

                {/* Company row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="p-company" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Company
                    </Label>
                    <Input id="p-company" placeholder="Acme Inc" value={form.company_name} onChange={(e) => updateField("company_name", e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]" />
                  </div>
                  <div>
                    <Label htmlFor="p-title" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Job title</Label>
                    <Input id="p-title" placeholder="VP of Sales" value={form.job_title} onChange={(e) => updateField("job_title", e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]" />
                  </div>
                </div>

                {/* Links row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="p-linkedin" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> LinkedIn
                    </Label>
                    <Input id="p-linkedin" placeholder="linkedin.com/in/name" value={form.linkedin_url} onChange={(e) => updateField("linkedin_url", e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]" />
                  </div>
                  <div>
                    <Label htmlFor="p-website" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </Label>
                    <Input id="p-website" placeholder="company.com" value={form.website_url} onChange={(e) => updateField("website_url", e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]" />
                  </div>
                </div>

                {/* Phone + Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="p-phone" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </Label>
                    <Input id="p-phone" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]" />
                  </div>
                  <div>
                    <Label htmlFor="p-location" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Location
                    </Label>
                    <Input id="p-location" placeholder="San Francisco, CA" value={form.location} onChange={(e) => updateField("location", e.target.value)}
                      className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)]" />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="p-notes" className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Notes</Label>
                  <Textarea
                    id="p-notes"
                    placeholder="Any context about this prospect..."
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={2}
                    className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] focus:border-[var(--pp-accent1)] resize-none"
                  />
                </div>

                {/* Error / Success */}
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 text-sm text-[var(--pp-accent2)] bg-[var(--pp-accent2)]/10 border border-[var(--pp-accent2)]/20 rounded-lg p-3">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    Prospect added successfully!
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.email}
                    className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo transition-all duration-200 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                    Add Prospect
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
