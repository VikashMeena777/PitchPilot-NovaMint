-- =============================================
-- Migration: Add RLS policies for email_templates + billing_events
-- =============================================

-- Ensure RLS is enabled on email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (safe re-run)
DROP POLICY IF EXISTS "email_templates_select_own" ON public.email_templates;
DROP POLICY IF EXISTS "email_templates_insert_own" ON public.email_templates;
DROP POLICY IF EXISTS "email_templates_update_own" ON public.email_templates;
DROP POLICY IF EXISTS "email_templates_delete_own" ON public.email_templates;

-- Users can only see their own templates
CREATE POLICY "email_templates_select_own" ON public.email_templates
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert templates for themselves
CREATE POLICY "email_templates_insert_own" ON public.email_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "email_templates_update_own" ON public.email_templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "email_templates_delete_own" ON public.email_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure RLS is enabled on billing_events
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_events_select_own" ON public.billing_events;
CREATE POLICY "billing_events_select_own" ON public.billing_events
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert billing events (webhooks)
DROP POLICY IF EXISTS "billing_events_insert_service" ON public.billing_events;
CREATE POLICY "billing_events_insert_service" ON public.billing_events
  FOR INSERT WITH CHECK (true);
