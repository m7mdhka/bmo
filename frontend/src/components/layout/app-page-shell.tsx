"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Box,
  BrainCircuit,
  Database,
  FolderKanban,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

const PAGE_ICONS = {
  FolderKanban,
  Database,
  BrainCircuit,
  Box,
  Settings,
} satisfies Record<string, LucideIcon>;

export type AppPageIconName = keyof typeof PAGE_ICONS;

type AppPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  iconName?: AppPageIconName;
  actions?: ReactNode;
  className?: string;
};

export function AppPageHeader({
  eyebrow,
  title,
  description,
  iconName,
  actions,
  className,
}: AppPageHeaderProps) {
  const Icon = iconName ? PAGE_ICONS[iconName] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("border-b border-border pb-4", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 text-muted-foreground" aria-hidden /> : null}
            <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
          {description ? (
            <p className="mt-1 text-[10px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="mt-1 flex items-center gap-2">{actions}</div> : null}
      </div>
    </motion.div>
  );
}

type AppPageShellProps = AppPageHeaderProps & {
  children: ReactNode;
  footer?: ReactNode;
};

export function AppPageShell({ children, footer, ...header }: AppPageShellProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 font-mono">
      <AppPageHeader {...header} />
      {children}
      {footer ? (
        <div className="mt-auto pt-2">{footer}</div>
      ) : (
        <div className="mt-auto" />
      )}
    </div>
  );
}
