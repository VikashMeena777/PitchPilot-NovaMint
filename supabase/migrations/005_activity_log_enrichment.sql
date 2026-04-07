-- Activity Log & Enrichment Migration
-- Adds activity_log table and enrichment columns

-- Activity Log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_own_read' AND tablename = 'activity_log') THEN
    CREATE POLICY activity_own_read ON public.activity_log
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_own_insert' AND tablename = 'activity_log') THEN
    CREATE POLICY activity_own_insert ON public.activity_log
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Performance indexes for activity_log
CREATE INDEX IF NOT EXISTS idx_activity_user_created ON public.activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action ON public.activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_resource ON public.activity_log(resource_type, resource_id);

-- Allow service role to insert activity logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_service_insert' AND tablename = 'activity_log') THEN
    CREATE POLICY activity_service_insert ON public.activity_log
      FOR INSERT TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- Enrichment columns on prospects
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS enrichment_data JSONB;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS company_domain TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS location TEXT;

-- Sequence enrollment additional indexes
CREATE INDEX IF NOT EXISTS idx_enrollment_sequence_status 
  ON public.sequence_enrollments(sequence_id, status);

-- Email sequence tracking
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS sequence_id UUID;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS step_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_emails_sequence ON public.emails(sequence_id) WHERE sequence_id IS NOT NULL;

-- Auto-cleanup old activity logs (keep 90 days)
-- This should be run as a scheduled function or cron job
-- DELETE FROM public.activity_log WHERE created_at < now() - interval '90 days';
