import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(new URL("/onboarding", origin));
        }

        const forwardUrl = new URL(next, origin);
        return NextResponse.redirect(forwardUrl);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
