"use client";

import { useState } from "react";
import { Bot, Files } from "lucide-react";

import { cn } from "@/lib/utils";

import type { FileNode, OpenFile } from "./workspace-types";
import { WorkspaceFilesPanel } from "./workspace-files-panel";
import { WorkspaceAgentPanel } from "./workspace-agent-panel";

type LeftRailView = "files" | "agent";

export function WorkspaceLeftRail({
  projectId,
  treeData,
  onOpenFile,
  openFiles,
  activeFileId,
}: {
  projectId: string;
  treeData: FileNode[];
  onOpenFile: (id: string) => void;
  openFiles: OpenFile[];
  activeFileId?: string;
}) {
  const [view, setView] = useState<LeftRailView>("files");

  return (
    <aside className="w-80 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-10 items-center justify-between border-b border-sidebar-border px-2">
        <div className="flex items-center gap-1.5">
          <RailTab
            active={view === "files"}
            onClick={() => setView("files")}
            icon={<Files className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Files"
          />
          <RailTab
            active={view === "agent"}
            onClick={() => setView("agent")}
            icon={<Bot className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Agent"
          />
        </div>
        <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
          {projectId}
        </div>
      </div>

      <div className="h-[calc(100%-2.5rem)]">
        {view === "files" ? (
          <WorkspaceFilesPanel projectId={projectId} treeData={treeData} onOpenFile={onOpenFile} />
        ) : (
          <WorkspaceAgentPanel projectId={projectId} openFiles={openFiles} activeFileId={activeFileId} />
        )}
      </div>
    </aside>
  );
}

function RailTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 border px-2 text-[10px] font-semibold uppercase tracking-[0.15em]",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
      )}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}

