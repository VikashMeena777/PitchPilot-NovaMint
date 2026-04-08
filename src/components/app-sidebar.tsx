"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Zap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Send,
  Sparkles,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Prospects",
    href: "/prospects",
    icon: Users,
  },
  {
    label: "Sequences",
    href: "/sequences",
    icon: Zap,
  },
  {
    label: "Emails",
    href: "/emails",
    icon: Send,
  },
  {
    label: "Templates",
    href: "/templates",
    icon: FileText,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
];

const bottomNavItems = [
  {
    label: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="h-screen sticky top-0 flex flex-col border-r border-[var(--pp-border-subtle)] bg-[var(--pp-bg-deepest)] z-40"
    >
      {/* Logo */}
      <div className="flex items-center h-16 border-b border-[var(--pp-border-subtle)] px-4">
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--pp-accent1)] to-[var(--pp-accent4)] flex items-center justify-center flex-shrink-0 shadow-md glow-indigo transition-transform duration-200 group-hover:scale-105">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold tracking-tight text-[var(--pp-text-primary)] whitespace-nowrap"
                style={{ fontFamily: "var(--font-display)" }}
              >
                PitchPilot
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* AI Badge */}
      <div className="px-3 mt-4 mb-2">
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-br from-[var(--pp-accent1)]/10 to-[var(--pp-accent4)]/5 border border-[var(--pp-border-accent)]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--pp-accent1-light)]" />
                <div>
                  <p className="text-xs font-semibold text-[var(--pp-accent1-light)]">AI Engine</p>
                  <p className="text-[10px] text-[var(--pp-text-muted)]">Personalization active</p>
                </div>
              </div>
              <div className="badge-live absolute top-2 right-2">
                <span className="sr-only">Live</span>
              </div>
            </motion.div>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--pp-accent1)]/10 to-[var(--pp-accent4)]/5 border border-[var(--pp-border-accent)] flex items-center justify-center mx-auto cursor-default">
                  <Sparkles className="w-4 h-4 text-[var(--pp-accent1-light)]" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                AI Engine Active
              </TooltipContent>
            </Tooltip>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger>
                <Link
                  href={item.href}
                  className={`
                    flex items-center justify-center w-10 h-10 mx-auto rounded-xl
                    transition-all duration-200 cursor-pointer
                    ${isActive
                      ? "bg-[var(--pp-accent1)]/15 text-[var(--pp-accent1-light)] shadow-sm"
                      : "text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] hover:bg-[var(--pp-bg-surface2)]"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 cursor-pointer group
                ${isActive
                  ? "bg-[var(--pp-accent1)]/15 text-[var(--pp-accent1-light)] shadow-sm"
                  : "text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] hover:bg-[var(--pp-bg-surface2)]"
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute left-0 w-[3px] h-6 rounded-r-full bg-[var(--pp-accent1)]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-3 space-y-1 border-t border-[var(--pp-border-subtle)] pt-3">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger>
                <Link
                  href={item.href}
                  className={`
                    flex items-center justify-center w-10 h-10 mx-auto rounded-xl
                    transition-all duration-200 cursor-pointer
                    ${isActive
                      ? "bg-[var(--pp-accent1)]/15 text-[var(--pp-accent1-light)]"
                      : "text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] hover:bg-[var(--pp-bg-surface2)]"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 cursor-pointer
                ${isActive
                  ? "bg-[var(--pp-accent1)]/15 text-[var(--pp-accent1-light)]"
                  : "text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] hover:bg-[var(--pp-bg-surface2)]"
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Logout */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-10 h-10 mx-auto text-[var(--pp-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Sign out
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-[var(--pp-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Sign out</span>
          </Button>
        )}

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={`
            ${collapsed ? "w-10 h-10 mx-auto" : "w-full h-10"}
            text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)]
            hover:bg-[var(--pp-bg-surface2)] transition-all duration-200 cursor-pointer
          `}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2 w-full px-1">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </div>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
