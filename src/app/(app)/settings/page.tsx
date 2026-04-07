"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getUserProfile, updateUserProfile } from "@/lib/actions/user";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Building2,
  Target,
  Mail,
  Save,
  Loader2,
  Globe,
  Shield,
  Bell,
  Send,
  CheckCircle2,
  XCircle,
  MapPin,
  Server,
  Key,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type UserProfile = {
  full_name: string;
  company_name: string;
  value_proposition: string;
  target_audience: string;
  tone_preset: string;
  sending_email: string;
  sending_name: string;
  timezone: string;
  daily_send_limit: number;
  plan: string;
  email: string;
  onboarding_completed: boolean;
  mailing_address: string;
  notify_replies: boolean;
  notify_daily_digest: boolean;
  notify_weekly_report: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  smtp_secure: boolean;
  api_key: string;
  gmail_connected: boolean;
  gmail_email: string;
};

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [isDisconnectingGmail, setIsDisconnectingGmail] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    company_name: "",
    value_proposition: "",
    target_audience: "",
    tone_preset: "professional",
    sending_email: "",
    sending_name: "",
    timezone: "UTC",
    daily_send_limit: 50,
    plan: "free",
    email: "",
    onboarding_completed: false,
    mailing_address: "",
    notify_replies: true,
    notify_daily_digest: true,
    notify_weekly_report: false,
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_pass: "",
    smtp_secure: true,
    api_key: "",
    gmail_connected: false,
    gmail_email: "",
  });

  useEffect(() => {
    const client = createClient();
    setSupabaseReady(!!client);

    // Handle Gmail OAuth callback messages
    const params = new URLSearchParams(window.location.search);
    const gmailStatus = params.get("gmail");
    if (gmailStatus === "success") {
      toast.success("Gmail connected successfully!");
      // Immediately update local UI state
      setProfile(prev => ({ ...prev, gmail_connected: true }));
      window.history.replaceState({}, "", "/settings");
      // Re-fetch profile to get the actual gmail_email from DB
      setTimeout(async () => {
        const result = await getUserProfile();
        if (result.data) {
          setProfile(prev => ({
            ...prev,
            gmail_connected: result.data.gmail_connected || false,
            gmail_email: result.data.gmail_email || "",
            sending_email: result.data.sending_email || prev.sending_email,
          }));
        }
      }, 500);
    } else if (gmailStatus === "error") {
      const reason = params.get("reason") || "unknown";
      toast.error(`Gmail connection failed: ${reason.replace(/_/g, " ")}`);
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  useEffect(() => {
    if (!supabaseReady) {
      setIsLoading(false);
      return;
    }
    (async () => {
      const result = await getUserProfile();
      if (result.data) {
        setProfile({
          full_name: result.data.full_name || "",
          company_name: result.data.company_name || "",
          value_proposition: result.data.value_proposition || "",
          target_audience: result.data.target_audience || "",
          tone_preset: result.data.tone_preset || "professional",
          sending_email: result.data.sending_email || "",
          sending_name: result.data.sending_name || "",
          timezone: result.data.timezone || "UTC",
          daily_send_limit: result.data.daily_send_limit || 50,
          plan: result.data.plan || "free",
          email: result.data.email || "",
          onboarding_completed: result.data.onboarding_completed || false,
          mailing_address: result.data.mailing_address || "",
          notify_replies: result.data.notify_replies ?? true,
          notify_daily_digest: result.data.notify_daily_digest ?? true,
          notify_weekly_report: result.data.notify_weekly_report ?? false,
          smtp_host: result.data.smtp_host || "",
          smtp_port: result.data.smtp_port || 587,
          smtp_user: result.data.smtp_user || "",
          smtp_pass: "",
          smtp_secure: result.data.smtp_secure ?? true,
          api_key: result.data.api_key || "",
          gmail_connected: result.data.gmail_connected || false,
          gmail_email: result.data.gmail_email || "",
        });
      }
      setIsLoading(false);
    })();
  }, [supabaseReady]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateUserProfile({
      full_name: profile.full_name,
      company_name: profile.company_name,
      value_proposition: profile.value_proposition,
      target_audience: profile.target_audience,
      tone_preset: profile.tone_preset,
      sending_email: profile.sending_email || undefined,
      sending_name: profile.sending_name || undefined,
      timezone: profile.timezone,
      daily_send_limit: profile.daily_send_limit,
      mailing_address: profile.mailing_address || undefined,
      notify_replies: profile.notify_replies,
      notify_daily_digest: profile.notify_daily_digest,
      notify_weekly_report: profile.notify_weekly_report,
      api_key: profile.api_key || undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Settings saved successfully");
    }
    setIsSaving(false);
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/emails/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: profile.email }),
      });
      if (res.ok) {
        setTestResult("success");
        toast.success("Test email sent! Check your inbox.");
      } else {
        setTestResult("error");
        const data = await res.json();
        toast.error(data.error || "Failed to send test email");
      }
    } catch {
      setTestResult("error");
      toast.error("Failed to send test email");
    }
    setIsTesting(false);
  };

  const updateField = (field: keyof UserProfile, value: string | number | boolean) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[var(--pp-accent1)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = [
    {
      id: "profile",
      title: "Profile",
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Full name</Label>
            <Input value={profile.full_name} onChange={(e) => updateField("full_name", e.target.value)}
              className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)]" />
          </div>
          <div>
            <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Email</Label>
            <Input value={profile.email} disabled
              className="bg-[var(--pp-bg-deepest)]/50 border-[var(--pp-border-subtle)] text-[var(--pp-text-muted)] cursor-not-allowed" />
          </div>
        </div>
      ),
    },
    {
      id: "business",
      title: "Business",
      icon: Building2,
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Company name</Label>
            <Input value={profile.company_name} onChange={(e) => updateField("company_name", e.target.value)}
              className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)]" />
          </div>
          <div>
            <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Value proposition</Label>
            <Textarea value={profile.value_proposition} onChange={(e) => updateField("value_proposition", e.target.value)} rows={3}
              className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)] resize-none" />
          </div>
        </div>
      ),
    },
    {
      id: "audience",
      title: "Target Audience",
      icon: Target,
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Target audience description</Label>
            <Textarea value={profile.target_audience} onChange={(e) => updateField("target_audience", e.target.value)} rows={3}
              placeholder="Describe your ideal customer..."
              className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)] resize-none" />
          </div>
          <div>
            <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">AI tone preset</Label>
            <select value={profile.tone_preset} onChange={(e) => updateField("tone_preset", e.target.value)}
              className="w-full bg-[var(--pp-bg-deepest)] border border-[var(--pp-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)] outline-none cursor-pointer">
              <option value="professional">💼 Professional</option>
              <option value="casual">👋 Casual</option>
              <option value="bold">🔥 Bold</option>
              <option value="consultative">🧠 Consultative</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      id: "email",
      title: "Email Configuration",
      icon: Mail,
      content: (
        <div className="space-y-5">
          {/* Sending identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Sender name</Label>
              <Input value={profile.sending_name} onChange={(e) => updateField("sending_name", e.target.value)}
                placeholder="Alex from Acme"
                className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)]" />
            </div>
            <div>
              <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Reply-to email</Label>
              <Input value={profile.sending_email} onChange={(e) => updateField("sending_email", e.target.value)}
                placeholder="alex@acme.com" type="email"
                className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)]" />
            </div>
          </div>

          {/* Sending limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Timezone
              </Label>
              <Input value={profile.timezone} onChange={(e) => updateField("timezone", e.target.value)}
                placeholder="UTC"
                className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)]" />
            </div>
            <div>
              <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Daily send limit</Label>
              <Input type="number" value={profile.daily_send_limit} onChange={(e) => updateField("daily_send_limit", parseInt(e.target.value) || 50)}
                className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)]" />
            </div>
          </div>

          {/* Test email */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleTestEmail}
              disabled={isTesting}
              variant="outline"
              className="bg-transparent border-[var(--pp-border-default)] text-[var(--pp-text-secondary)] hover:bg-[var(--pp-bg-surface2)] cursor-pointer"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              Send Test Email
            </Button>
            {testResult === "success" && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sent successfully
              </span>
            )}
            {testResult === "error" && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <XCircle className="w-3.5 h-3.5" /> Failed to send
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "gmail",
      title: "Gmail Integration",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-[var(--pp-text-muted)]">
            Connect your Gmail account to send emails directly from your own inbox with full deliverability.
          </p>
          {profile.gmail_connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Gmail Connected</p>
                  <p className="text-xs text-[var(--pp-text-muted)]">{profile.gmail_email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
                disabled={isDisconnectingGmail}
                onClick={async () => {
                  setIsDisconnectingGmail(true);
                  try {
                    const res = await fetch("/api/auth/gmail/disconnect", { method: "POST" });
                    if (res.ok) {
                      setProfile({ ...profile, gmail_connected: false, gmail_email: "" });
                      toast.success("Gmail disconnected");
                    } else {
                      toast.error("Failed to disconnect Gmail");
                    }
                  } catch {
                    toast.error("Failed to disconnect Gmail");
                  }
                  setIsDisconnectingGmail(false);
                }}
              >
                {isDisconnectingGmail ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                Disconnect Gmail
              </Button>
            </div>
          ) : (
            <Button
              className="bg-white text-gray-800 hover:bg-gray-100 font-semibold cursor-pointer"
              onClick={() => { window.location.href = "/api/auth/gmail"; }}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.27 9.27L1.25 6.05C.28 7.75-.13 9.78.05 11.8l3.91 3.09L5.27 9.27z"/><path fill="#34A853" d="M12 10.8L5.27 9.27 3.96 14.89 12 19.6l8.04-4.71-1.31-5.62L12 10.8z"/><path fill="#4285F4" d="M18.73 9.27l1.31 5.62L23.95 11.8c.18-2.02-.23-4.05-1.2-5.75l-4.02 3.22z"/><path fill="#FBBC05" d="M12 4.4l6.73 4.87L22.75 6.05A11.95 11.95 0 0012 0C9.17 0 6.6 1.11 4.68 2.97L12 4.4z"/></svg>
              Connect Gmail Account
            </Button>
          )}
        </div>
      ),
    },
    {
      id: "smtp",
      title: "Custom SMTP (Optional)",
      icon: Server,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-[var(--pp-text-muted)]">
            Configure a custom SMTP server to send emails from your own domain. Leave blank to use the default sending service (Resend).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">SMTP Host</Label>
              <Input value={profile.smtp_host} onChange={(e) => updateField("smtp_host", e.target.value)}
                placeholder="smtp.gmail.com"
                className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)]" />
            </div>
            <div>
              <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">SMTP Port</Label>
              <Input type="number" value={profile.smtp_port} onChange={(e) => updateField("smtp_port", parseInt(e.target.value) || 587)}
                className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)]" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Username</Label>
              <Input value={profile.smtp_user} onChange={(e) => updateField("smtp_user", e.target.value)}
                placeholder="user@domain.com"
                className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)]" />
            </div>
            <div>
              <Label className="text-[var(--pp-text-secondary)] text-sm mb-1.5 block">Password</Label>
              <Input type="password" value={profile.smtp_pass} onChange={(e) => updateField("smtp_pass", e.target.value)}
                placeholder="••••••••"
                className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)]" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={profile.smtp_secure}
              onCheckedChange={(checked) => updateField("smtp_secure", checked)}
            />
            <Label className="text-[var(--pp-text-secondary)] text-sm cursor-pointer">Use TLS/SSL encryption</Label>
          </div>
        </div>
      ),
    },
    {
      id: "address",
      title: "Mailing Address",
      icon: MapPin,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-[var(--pp-text-muted)]">
            Required by CAN-SPAM law. This address will be included in the footer of all outreach emails you send.
          </p>
          <Textarea
            value={profile.mailing_address}
            onChange={(e) => updateField("mailing_address", e.target.value)}
            rows={2}
            placeholder="123 Business St, Suite 100, City, State 12345, Country"
            className="bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)] resize-none"
          />
        </div>
      ),
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: Bell,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-[var(--pp-text-primary)]">Reply notifications</p>
              <p className="text-xs text-[var(--pp-text-muted)]">Get notified when a prospect replies to your email</p>
            </div>
            <Switch
              checked={profile.notify_replies}
              onCheckedChange={(checked) => updateField("notify_replies", checked)}
            />
          </div>
          <div className="border-t border-[var(--pp-border-subtle)]" />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-[var(--pp-text-primary)]">Daily digest</p>
              <p className="text-xs text-[var(--pp-text-muted)]">Receive a daily summary of your outreach performance</p>
            </div>
            <Switch
              checked={profile.notify_daily_digest}
              onCheckedChange={(checked) => updateField("notify_daily_digest", checked)}
            />
          </div>
          <div className="border-t border-[var(--pp-border-subtle)]" />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-[var(--pp-text-primary)]">Weekly report</p>
              <p className="text-xs text-[var(--pp-text-muted)]">Get a detailed weekly analytics report every Monday</p>
            </div>
            <Switch
              checked={profile.notify_weekly_report}
              onCheckedChange={(checked) => updateField("notify_weekly_report", checked)}
            />
          </div>
        </div>
      ),
    },
    {
      id: "plan",
      title: "Plan & Billing",
      icon: Shield,
      content: (
        <div className="flex items-center justify-between p-4 bg-[var(--pp-bg-deepest)] rounded-xl border border-[var(--pp-border-subtle)]">
          <div>
            <span className="label-meta text-[var(--pp-accent1-light)] text-[10px] block mb-1">CURRENT PLAN</span>
            <span className="text-lg font-bold text-[var(--pp-text-primary)] capitalize" style={{ fontFamily: "var(--font-display)" }}>
              {profile.plan}
            </span>
          </div>
          <Button variant="outline" className="bg-transparent border-[var(--pp-border-default)] text-[var(--pp-text-secondary)] hover:bg-[var(--pp-bg-surface2)] cursor-pointer"
            onClick={() => window.location.href = "/billing"}>
            Upgrade
          </Button>
        </div>
      ),
    },
    {
      id: "api",
      title: "API & Integrations",
      icon: Key,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-[var(--pp-text-muted)]">
            Use your API key to integrate PitchPilot with Zapier, Make, n8n, or your CRM.
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={profile.api_key || ""}
              readOnly
              placeholder="No API key generated yet"
              className="font-mono text-xs bg-[var(--pp-bg-deepest)] border-[var(--pp-border-default)] text-[var(--pp-text-secondary)]"
            />
            {profile.api_key && (
              <Button
                variant="outline"
                size="icon"
                className="bg-transparent border-[var(--pp-border-default)] text-[var(--pp-text-secondary)] hover:bg-[var(--pp-bg-surface2)] cursor-pointer flex-shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(profile.api_key);
                  toast.success("API key copied!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-transparent border-[var(--pp-border-default)] text-[var(--pp-text-secondary)] hover:bg-[var(--pp-bg-surface2)] cursor-pointer"
              onClick={async () => {
                const newKey = `pp_${crypto.randomUUID().replace(/-/g, "")}`;
                setProfile({ ...profile, api_key: newKey });
                toast.success(profile.api_key ? "API key regenerated — save to apply" : "API key generated — save to apply");
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              {profile.api_key ? "Regenerate Key" : "Generate API Key"}
            </Button>
          </div>
          <div className="text-xs text-[var(--pp-text-muted)] bg-[var(--pp-bg-deepest)] rounded-lg p-3 border border-[var(--pp-border-subtle)]">
            <p className="font-medium text-[var(--pp-text-secondary)] mb-1">Webhook endpoint:</p>
            <code className="text-[var(--pp-accent1-light)]">
              POST /api/webhooks/inbound
            </code>
            <p className="mt-2">Include <code className="text-[var(--pp-accent1-light)]">X-API-Key</code> header with your key.</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Settings
          </h1>
          <p className="text-sm text-[var(--pp-text-muted)] mt-0.5">Manage your account and preferences</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save Changes
        </Button>
      </div>

      <div className="space-y-6 max-w-3xl">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const }}
              className="bg-[var(--pp-bg-surface)] border border-[var(--pp-border-subtle)] rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--pp-border-subtle)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--pp-accent1)]/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[var(--pp-accent1)]" />
                </div>
                <h2 className="text-sm font-semibold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                  {section.title}
                </h2>
              </div>
              <div className="p-6">
                {section.content}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
