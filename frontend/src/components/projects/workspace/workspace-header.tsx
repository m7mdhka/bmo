"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type WorkspaceHeaderProps = {
  className?: string;
  children: React.ReactNode;
};

export function WorkspaceHeader({ className, children }: WorkspaceHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-10 items-center justify-between border-b border-sidebar-border bg-sidebar px-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

type WorkspaceHeaderTitleProps = {
  className?: string;
  children: React.ReactNode;
};

export function WorkspaceHeaderTitle({ className, children }: WorkspaceHeaderTitleProps) {
  return (
    <div
      className={cn(
        "text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

type WorkspaceHeaderIconButtonProps = {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
};

export function WorkspaceHeaderIconButton({
  label,
  onClick,
  icon,
  active,
}: WorkspaceHeaderIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center border",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

