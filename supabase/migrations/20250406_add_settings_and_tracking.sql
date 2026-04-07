-- ============================================
-- Migration: Add settings, notifications, and warm-up columns to users table
-- ============================================

-- Mailing address for CAN-SPAM compliance
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS mailing_address TEXT;

-- Notification preferences
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notify_replies BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notify_daily_digest BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notify_weekly_report BOOLEAN DEFAULT true;

-- SMTP password (encrypted, stored separately from smtp_username)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS smtp_password TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS smtp_use_tls BOOLEAN DEFAULT true;

-- Research tracking on prospects
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS research_status TEXT DEFAULT 'pending';
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS researched_at TIMESTAMPTZ;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Bounce tracking on emails
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS bounce_type TEXT; -- 'hard' or 'soft'
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ;

-- Index for research queue
CREATE INDEX IF NOT EXISTS idx_prospects_research_queue
  ON public.prospects (research_status, status, created_at)
  WHERE research_data IS NULL;

-- Index for bounce tracking
CREATE INDEX IF NOT EXISTS idx_emails_bounced
  ON public.emails (bounce_type)
  WHERE bounce_type IS NOT NULL;
