"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AppHeader({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  const initials =
    user?.user_metadata?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <header className="h-16 border-b border-[var(--pp-border-subtle)] bg-[var(--pp-bg-deepest)]/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 gap-3">
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-[var(--pp-text-muted)] cursor-pointer flex-shrink-0"
          onClick={onMobileMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <div className="max-w-md w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pp-text-muted)]" />
            <Input
              placeholder="Search prospects, sequences..."
              className="pl-10 h-9 bg-[var(--pp-bg-surface)] border-[var(--pp-border-subtle)] text-sm text-[var(--pp-text-primary)] placeholder:text-[var(--pp-text-muted)] input-glow transition-all duration-200 w-full"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] text-[var(--pp-text-muted)] bg-[var(--pp-bg-surface2)] border border-[var(--pp-border-subtle)] rounded font-mono">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] transition-colors duration-200 cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--pp-accent1)] ring-2 ring-[var(--pp-bg-deepest)]" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
              className="flex items-center h-9 gap-2 px-2 cursor-pointer hover:bg-[var(--pp-bg-surface2)] transition-all duration-200 rounded-md border-none bg-transparent outline-none"
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-gradient-to-br from-[var(--pp-accent1)] to-[var(--pp-accent4)] text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-[var(--pp-text-primary)] hidden sm:block">
                {user?.user_metadata?.full_name ?? user?.email ?? "User"}
              </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-[var(--pp-bg-surface)] border-[var(--pp-border-default)] text-[var(--pp-text-primary)]"
          >
            <DropdownMenuLabel className="text-[var(--pp-text-secondary)]">
              <p className="text-sm font-medium text-[var(--pp-text-primary)]">
                {user?.user_metadata?.full_name ?? "User"}
              </p>
              <p className="text-xs text-[var(--pp-text-muted)]">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[var(--pp-border-subtle)]" />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-[var(--pp-bg-surface2)]"
              onClick={() => router.push("/settings")}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-[var(--pp-bg-surface2)]"
              onClick={() => router.push("/billing")}
            >
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[var(--pp-border-subtle)]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
