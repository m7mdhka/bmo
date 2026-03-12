"use client";

import * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

export const ResizablePanelGroup = Group;
export const ResizablePanel = Panel;

export function ResizableHandle({
  orientation = "horizontal",
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  orientation?: "horizontal" | "vertical";
}) {
  const isHorizontal = orientation === "horizontal";
  return (
    <Separator
      className={cn(
        // Render a single 1px divider line, but keep a larger hit target.
        isHorizontal
          ? "relative flex h-full w-px items-stretch justify-center bg-transparent"
          : "relative flex h-px w-full items-stretch justify-center bg-transparent",
        isHorizontal
          ? "before:absolute before:inset-y-0 before:-inset-x-2 before:content-['']"
          : "before:absolute before:inset-x-0 before:-inset-y-2 before:content-['']",
        isHorizontal
          ? "after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-sidebar-border"
          : "after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-sidebar-border",
        "data-[separator=hover]:after:bg-ring/40 data-[separator=active]:after:bg-ring",
        isHorizontal ? "cursor-col-resize" : "cursor-row-resize",
        className,
      )}
      {...props}
    />
  );
}
