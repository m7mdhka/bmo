"use client";

import * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

export const ResizablePanelGroup = Group;
export const ResizablePanel = Panel;

export function ResizableHandle({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn(
        // Render a single 1px divider line, but keep a larger hit target.
        "relative flex h-full w-px items-stretch justify-center bg-transparent",
        "before:absolute before:inset-y-0 before:-inset-x-2 before:content-['']",
        "after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-border",
        "data-[separator=hover]:after:bg-ring/40 data-[separator=active]:after:bg-ring",
        "cursor-col-resize",
        className,
      )}
      {...props}
    />
  );
}
