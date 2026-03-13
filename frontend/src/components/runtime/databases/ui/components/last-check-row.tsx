"use client";

import { Power } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LastCheckRow({
  value,
  onTest,
}: {
  value: string;
  onTest: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 border border-border bg-background px-3 py-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Last check
        </p>
        <p className="mt-0.5 text-xs text-foreground">{value}</p>
      </div>
      <Button variant="outline" size="xs" onClick={onTest} className="mt-0.5">
        <Power className="h-3 w-3" />
        Test
      </Button>
    </div>
  );
}

