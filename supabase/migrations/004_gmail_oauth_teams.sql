-- Gmail OAuth Integration Migration
-- Adds Gmail OAuth fields to the users table for connected Gmail accounts

-- Add Gmail OAuth columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gmail_connected BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gmail_email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gmail_access_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gmail_token_expires_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gmail_oauth_state TEXT;

-- Add research_status column for prospect research tracking
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS research_status TEXT DEFAULT 'pending';
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS researched_at TIMESTAMPTZ;

-- Add warm-up tracking columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS warmup_started_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS warmup_completed BOOLEAN DEFAULT false;

-- Add email template columns for better management  
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Performance indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_gmail_connected ON public.users(gmail_connected) WHERE gmail_connected = true;
CREATE INDEX IF NOT EXISTS idx_prospects_research_status ON public.prospects(research_status);

-- Add team/multi-user columns (Agency plan foundation)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- Create teams table for multi-user support
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free',
  max_members INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_owner_all' AND tablename = 'teams') THEN
    CREATE POLICY team_owner_all ON public.teams
      FOR ALL TO authenticated
      USING (owner_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_member_read' AND tablename = 'teams') THEN
    CREATE POLICY team_member_read ON public.teams
      FOR SELECT TO authenticated
      USING (id IN (SELECT team_id FROM public.users WHERE id = auth.uid()));
  END IF;
END $$;

-- Add sequence_enrollments missing columns for better tracking
ALTER TABLE public.sequence_enrollments ADD COLUMN IF NOT EXISTS stopped_at TIMESTAMPTZ;
ALTER TABLE public.sequence_enrollments ADD COLUMN IF NOT EXISTS stopped_reason TEXT;
ALTER TABLE public.sequence_enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add email tracking columns
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS has_reply BOOLEAN DEFAULT false;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS reply_body TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS reply_category TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS reply_sentiment TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS reply_received_at TIMESTAMPTZ;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS bounce_type TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Indexes for email reply/bounce tracking
CREATE INDEX IF NOT EXISTS idx_emails_has_reply ON public.emails(has_reply) WHERE has_reply = true;
CREATE INDEX IF NOT EXISTS idx_emails_bounce ON public.emails(bounce_type) WHERE bounce_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_reply_category ON public.emails(reply_category) WHERE reply_category IS NOT NULL;
