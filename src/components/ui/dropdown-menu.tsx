"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ────────────────────────────────────────────
   Lightweight custom dropdown menu built with
   pure React — no external library required.
   Drop-in replacement for the Base UI version.
   ──────────────────────────────────────────── */

interface DropdownMenuContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType>({
  open: false,
  setOpen: () => {},
})

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  // Close on outside click
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block" data-slot="dropdown-menu">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  className,
  children,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  return (
    <button
      type="button"
      data-slot="dropdown-menu-trigger"
      aria-expanded={open}
      className={className}
      onClick={() => setOpen((prev) => !prev)}
      {...props}
    >
      {children}
    </button>
  )
}

function DropdownMenuContent({
  className,
  align = "end",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "center" | "end"
}) {
  const { open } = React.useContext(DropdownMenuContext)
  if (!open) return null

  return (
    <div
      data-slot="dropdown-menu-content"
      className={cn(
        "absolute top-full mt-2 z-50 min-w-[8rem] overflow-hidden rounded-lg border p-1 shadow-lg",
        "bg-popover text-popover-foreground border-border",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
        align === "end" && "right-0",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn(
        "px-2 py-1.5 text-xs font-medium text-muted-foreground",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  const { setOpen } = React.useContext(DropdownMenuContext)
  return (
    <div
      role="menuitem"
      data-slot="dropdown-menu-item"
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      onClick={(e) => {
        props.onClick?.(e)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

// Stubs for unused but exported types (prevents import errors elsewhere)
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuGroup = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSubTrigger = DropdownMenuItem
const DropdownMenuSubContent = DropdownMenuContent
const DropdownMenuCheckboxItem = DropdownMenuItem
const DropdownMenuRadioGroup = DropdownMenuGroup
const DropdownMenuRadioItem = DropdownMenuItem
function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
