"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function ToggleSwitch({
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex h-4 w-7 items-center border border-border bg-background transition-colors disabled:opacity-50",
        checked && "border-primary bg-primary/20",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center bg-card text-[9px] transition-transform",
          checked ? "translate-x-3 text-primary" : "translate-x-0 text-muted-foreground",
        )}
      >
        {checked ? <Check className="h-2.5 w-2.5" aria-hidden /> : null}
      </span>
    </button>
  );
}

