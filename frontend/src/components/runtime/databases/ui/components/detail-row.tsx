"use client";

import { cn } from "@/lib/utils";

export function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="border border-border bg-background px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 text-xs text-foreground", mono && "font-mono")}>
        {value}
      </p>
    </div>
  );
}

