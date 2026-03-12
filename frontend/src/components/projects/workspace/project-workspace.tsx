"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NodeApi } from "react-arborist";
import { Tree } from "react-arborist";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { ChevronRight, File, Folder, FolderOpen, Search, X } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  language?: string;
  content?: string;
  children?: FileNode[];
};

type OpenFile = {
  id: string;
  title: string;
  language?: string;
  content: string;
};

const MonacoEditor = dynamic(() => import("./project-workspace-editor").then((m) => m.ProjectWorkspaceEditor), {
  ssr: false,
});

function buildMockTree(projectId: string): FileNode[] {
  // Placeholder until project filesystem wiring lands.
  const readme = `# ${projectId}\n\nThis is a local project workspace.\n`;
  return [
    {
      id: "root-src",
      name: "src",
      type: "folder",
      children: [
        {
          id: "file-app",
          name: "app.ts",
          type: "file",
          language: "typescript",
          content: `export function hello() {\n  return "Hello from ${projectId}";\n}\n`,
        },
        {
          id: "file-utils",
          name: "utils.ts",
          type: "file",
          language: "typescript",
          content: `export function sum(a: number, b: number) {\n  return a + b;\n}\n`,
        },
      ],
    },
    {
      id: "file-readme",
      name: "README.md",
      type: "file",
      language: "markdown",
      content: readme,
    },
  ];
}

function flattenFiles(nodes: FileNode[]) {
  const out = new Map<string, FileNode>();
  const walk = (n: FileNode) => {
    out.set(n.id, n);
    for (const c of n.children ?? []) walk(c);
  };
  for (const n of nodes) walk(n);
  return out;
}

export function ProjectWorkspace({
  projectId,
}: {
  projectId: string;
}) {
  const treeData = useMemo(() => buildMockTree(projectId), [projectId]);
  const byId = useMemo(() => flattenFiles(treeData), [treeData]);

  const [fileQuery, setFileQuery] = useState("");
  const [openFiles, setOpenFiles] = useState<OpenFile[]>(() => [
    { id: "file-readme", title: "README.md", language: "markdown", content: byId.get("file-readme")?.content ?? "" },
  ]);
  const [activeId, setActiveId] = useState(openFiles[0]?.id ?? "");

  const tabsStripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Avoid "already scrolled" feeling when switching workspaces or after HMR.
    tabsStripRef.current?.scrollTo({ left: 0 });
  }, [projectId]);

  useEffect(() => {
    if (!activeId) return;
    const el = tabsStripRef.current?.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  function openFile(id: string) {
    const n = byId.get(id);
    if (!n || n.type !== "file") return;

    setOpenFiles((prev) => {
      if (prev.some((f) => f.id === id)) return prev;
      return [
        ...prev,
        {
          id,
          title: n.name,
          language: n.language,
          content: n.content ?? "",
        },
      ];
    });
    setActiveId(id);
  }

  function closeFile(id: string) {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      setActiveId((cur) => {
        if (cur !== id) return cur;
        return next[next.length - 1]?.id ?? "";
      });
      return next;
    });
  }

  const active = openFiles.find((f) => f.id === activeId) ?? openFiles[0];

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      <aside className="w-72 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-10 items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Files</span>
          <span className="font-mono text-[10px] text-muted-foreground/60">{projectId}</span>
        </div>
        <div className="px-3 pb-2">
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
            {fileQuery.trim().length ? (
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
        <div className="h-[calc(100%-5.5rem)] overflow-hidden py-2">
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
                  searchMatch={(node, term) => {
                    const q = term.trim().toLowerCase();
                    if (!q) return true;
                    return node.data.name.toLowerCase().includes(q);
                  }}
                  onActivate={(node) => {
                    if (node.data.type === "folder") node.toggle();
                    else openFile(node.data.id);
                  }}
                >
                  {FileTreeRow}
                </Tree>
              );
            }}
          />
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* File tabs */}
        <div className="shrink-0 border-b border-border bg-sidebar px-2 pt-1">
          <div
            ref={tabsStripRef}
            className="no-scrollbar flex h-9 items-end gap-1 overflow-x-auto overflow-y-hidden pb-0"
          >
            {openFiles.length === 0 ? (
              <div className="px-2 pb-1 text-[10px] text-muted-foreground">No file opened</div>
            ) : null}
            {openFiles.map((f) => {
              const isActive = f.id === activeId;
              return (
                <div
                  key={f.id}
                  data-tab-id={f.id}
                  onClick={() => setActiveId(f.id)}
                  className={cn(
                    "group relative -mb-px flex h-8 flex-none items-center gap-2 border px-2 text-xs",
                    "max-w-[14rem] rounded-none",
                    isActive
                      ? "z-10 border-border border-b-background bg-background text-foreground"
                      : "border-transparent bg-transparent text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
                  )}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveId(f.id);
                    }
                  }}
                >
                  <span className="truncate">{f.title}</span>
                  <button
                    type="button"
                    className={cn(
                      "ml-1 inline-flex h-4 w-4 items-center justify-center border border-transparent",
                      "text-muted-foreground hover:border-border hover:bg-background hover:text-foreground",
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      closeFile(f.id);
                    }}
                    aria-label={`Close ${f.title}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        <div className="min-h-0 flex-1">
          {active ? (
            <MonacoEditor
              key={active.id}
              language={active.language}
              value={active.content}
              onChange={(next) => {
                setOpenFiles((prev) => prev.map((f) => (f.id === active.id ? { ...f, content: next } : f)));
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Select a file to start editing.
            </div>
          )}
        </div>
      </section>
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
    <div
      style={style}
      className={cn("px-2")}
    >
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
            isFolder
              ? "text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground"
              : "opacity-0",
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
