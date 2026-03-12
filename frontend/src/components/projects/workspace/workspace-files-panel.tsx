"use client";

import { useMemo, useState } from "react";
import type { NodeApi } from "react-arborist";
import { Tree } from "react-arborist";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { ChevronRight, File, Folder, FolderOpen, Search, X } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { FileNode } from "./workspace-types";

export function WorkspaceFilesPanel({
  treeData,
  onOpenFile,
}: {
  treeData: FileNode[];
  onOpenFile: (id: string) => void;
}) {
  const [fileQuery, setFileQuery] = useState("");

  const searchTerm = fileQuery.trim();
  const searchMatch = useMemo(() => {
    return (node: NodeApi<FileNode>, term: string) => {
      const q = term.trim().toLowerCase();
      if (!q) return true;
      return node.data.name.toLowerCase().includes(q);
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-2 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" aria-hidden="true" />
          <input
            value={fileQuery}
            onChange={(e) => setFileQuery(e.target.value)}
            placeholder="Search files"
            className={cn(
              "h-8 w-full border border-sidebar-border bg-background/40 pl-7 pr-8 text-xs text-foreground",
              "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30",
            )}
          />
          {searchTerm.length ? (
            <button
              type="button"
              onClick={() => setFileQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 border border-transparent p-1 text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <Separator />

      <div className="min-h-0 flex-1 overflow-hidden py-2">
        <AutoSizer
          renderProp={({ width, height }) => {
            if (!width || !height) return null;
            return (
              <Tree<FileNode>
                data={treeData}
                width={width}
                height={height}
                indent={14}
                rowHeight={26}
                overscanCount={6}
                openByDefault={false}
                disableDrag
                disableDrop
                searchTerm={fileQuery}
                searchMatch={searchMatch}
                onActivate={(node) => {
                  if (node.data.type === "folder") node.toggle();
                  else onOpenFile(node.data.id);
                }}
              >
                {FileTreeRow}
              </Tree>
            );
          }}
        />
      </div>
    </div>
  );
}

function FileTreeRow({ node, style }: { node: NodeApi<FileNode>; style: React.CSSProperties }) {
  const isFolder = node.data.type === "folder";
  const isOpen = isFolder ? node.isOpen : false;
  const Icon = isFolder ? (isOpen ? FolderOpen : Folder) : File;
  const indent = node.tree.props.indent ?? 14;
  const padLeft = 10 + node.level * indent;

  return (
    <div style={style} className="px-2">
      <div
        className={cn(
          "group flex h-[26px] w-full items-center gap-1.5 border border-transparent text-xs",
          node.isSelected
            ? "border-primary/40 bg-primary/10 text-primary"
            : "text-sidebar-foreground/90 hover:border-sidebar-border hover:bg-secondary/40",
        )}
        style={{ paddingLeft: padLeft }}
        onClick={() => {
          node.focus();
          node.select();
        }}
        onDoubleClick={() => {
          if (isFolder) node.toggle();
          else node.activate();
        }}
      >
        <button
          type="button"
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center border border-transparent",
            isFolder ? "text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground" : "opacity-0",
          )}
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isFolder) node.toggle();
          }}
          aria-label={isFolder ? (isOpen ? "Collapse folder" : "Expand folder") : undefined}
        >
          {isFolder ? (
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen ? "rotate-90" : "rotate-0")} aria-hidden="true" />
          ) : null}
        </button>
        <Icon className={cn("h-4 w-4 shrink-0", isFolder ? "text-accent" : "text-muted-foreground")} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{node.data.name}</span>
      </div>
    </div>
  );
}
