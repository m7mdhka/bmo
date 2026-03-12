"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

type TabsRootProps = React.ComponentProps<typeof TabsPrimitive.Root>;
type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List>;
type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger>;

export function WorkspaceTabsRoot({ className, orientation = "horizontal", ...props }: TabsRootProps) {
  return (
    <TabsPrimitive.Root
      data-orientation={orientation}
      className={cn("flex gap-2 data-horizontal:flex-col", className)}
      {...props}
    />
  );
}

export function WorkspaceTabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex w-fit items-center justify-center",
        "no-scrollbar flex h-9 items-end gap-1 overflow-x-auto overflow-y-hidden pb-0",
        className,
      )}
      {...props}
    />
  );
}

type WorkspaceTabProps = TabsTriggerProps & {
  /**
   * Optional close button rendered on the right side of the tab.
   * Used for file tabs; omit for simple tabs like feature/terminal tabs.
   */
  closeButton?: React.ReactNode;
};

export function WorkspaceTab({ className, closeButton, children, ...props }: WorkspaceTabProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "group relative -mb-px flex h-8 flex-none items-center gap-2 border px-2 text-xs",
        "max-w-[14rem] rounded-none",
        "border-transparent bg-transparent text-muted-foreground",
        "hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
        "data-[state=active]:z-10 data-[state=active]:border-sidebar-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground",
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {closeButton ? (
        <span
          className="ml-1 inline-flex h-4 w-4 items-center justify-center border border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-background hover:text-foreground"
          onMouseDown={(e) => {
            // Prevent dragging focus when clicking the close icon.
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {closeButton}
        </span>
      ) : null}
    </TabsPrimitive.Trigger>
  );
}

