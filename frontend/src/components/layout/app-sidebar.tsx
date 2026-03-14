"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  Box,
  Settings,
  Database,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Nav config (icons live here — never cross the server/client boundary) */
type NavItem = {
  icon: LucideIcon;
  href: string;
  label: string;
  badge?: string;
  section: "workspace" | "runtime" | "ai" | "system";
};

const NAV_ITEMS: NavItem[] = [
  { icon: FolderKanban, href: "/projects", label: "Projects", section: "workspace" },
  { icon: Database, href: "/databases", label: "Connected Databases", section: "runtime" },
  { icon: BrainCircuit, href: "/llm-providers", label: "LLM Providers", section: "ai" },
  { icon: Box, href: "/templates", label: "Starters", section: "system" },
  { icon: Settings, href: "/settings", label: "Settings", section: "system" },
];

/* ─── Sidebar ────────────────────────────────────────────────────────────── */

export function AppSidebar() {
  const pathname = usePathname();

  const sections: Array<{ id: NavItem["section"]; label: string }> = [
    { id: "workspace", label: "Workspace" },
    { id: "runtime", label: "Runtime" },
    { id: "ai", label: "AI" },
    { id: "system", label: "System" },
  ];

  return (
    <aside className="flex h-[calc(100vh-2.25rem)] w-52 shrink-0 flex-col border-r border-sidebar-border bg-sidebar font-mono text-sidebar-foreground">
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-1.5 py-2">
        {sections.map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section.id);
          if (items.length === 0) return null;

          return (
            <div key={section.id}>
              <SectionLabel>{section.label}</SectionLabel>
              {items.map((item) => (
                <NavLink key={item.label} item={item} pathname={pathname} />
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <p className="font-mono text-[10px] text-muted-foreground/50">
          BMO v0.1.0
        </p>
      </div>
    </aside>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mt-3 mb-0.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
      {children}
    </p>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2 border px-2.5 py-1.5 text-xs transition-colors",
        isActive
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-secondary/50 hover:text-sidebar-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-colors",
          isActive ? "text-primary" : "group-hover:text-foreground",
        )}
        aria-hidden
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="bg-accent/20 px-1 py-0.5 text-[9px] font-medium text-accent">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
