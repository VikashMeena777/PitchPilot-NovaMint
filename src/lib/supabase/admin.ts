import { createClient } from "@supabase/supabase-js";

// Admin client uses service role key — bypasses RLS
// Only use in server-side code (cron jobs, webhooks, etc.)
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
