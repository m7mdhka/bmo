"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

/* ─── Sidebar shell ─────────────────────────────────────────────────────── */

type SidebarProps = {
  children: ReactNode;
  className?: string;
};

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-[calc(100vh-2.25rem)] w-52 shrink-0 flex-col border-r border-sidebar-border bg-sidebar font-mono text-sidebar-foreground",
        className,
      )}
    >
      {children}
    </aside>
  );
}

/* ─── Sections ─────────────────────────────────────────────────────────── */

type SectionProps = {
  children: ReactNode;
  className?: string;
};

export function SidebarHeader({ children, className }: SectionProps) {
  return (
    <div
      className={cn(
        "border-b border-sidebar-border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SidebarContent({ children, className }: SectionProps) {
  return (
    <nav className={cn("flex-1 space-y-0.5 overflow-y-auto px-1.5 py-2", className)}>
      {children}
    </nav>
  );
}

export function SidebarFooter({ children, className }: SectionProps) {
  return (
    <div
      className={cn(
        "border-t border-sidebar-border px-3 py-3 text-[10px] text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─── Nav item ─────────────────────────────────────────────────────────── */

type SidebarItemProps = {
  icon?: LucideIcon;
  href: string;
  label: string;
  badge?: string;
};

export function SidebarItem({ icon: Icon, href, label, badge }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2 border px-2.5 py-1.5 text-xs transition-colors",
        isActive
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-secondary/50 hover:text-sidebar-foreground",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-colors",
            isActive ? "text-primary" : "group-hover:text-foreground",
          )}
          aria-hidden="true"
        />
      )}
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-none bg-accent/20 px-1 py-0.5 text-[9px] font-medium text-accent">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Section label ────────────────────────────────────────────────────── */

export function SidebarSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 mb-0.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
      {children}
    </p>
  );
}

/* ─── Legacy alias kept for back-compat ────────────────────────────────── */
export function SidebarLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 border border-transparent px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-sidebar-border hover:bg-secondary/50 hover:text-sidebar-foreground"
    >
      {children}
    </Link>
  );
}
