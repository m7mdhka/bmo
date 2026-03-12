"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { NodeApi } from "react-arborist";
import { Tree } from "react-arborist";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { File, Folder, X } from "lucide-react";

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
  name,
}: {
  projectId: string;
  name: string;
}) {
  const treeData = useMemo(() => buildMockTree(projectId), [projectId]);
  const byId = useMemo(() => flattenFiles(treeData), [treeData]);

  const [openFiles, setOpenFiles] = useState<OpenFile[]>(() => [
    { id: "file-readme", title: "README.md", language: "markdown", content: byId.get("file-readme")?.content ?? "" },
  ]);
  const [activeId, setActiveId] = useState(openFiles[0]?.id ?? "");

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
        <Separator />
        <div className="h-[calc(100%-2.5rem)] overflow-hidden py-2">
          <AutoSizer
            renderProp={({ width, height }) => {
              if (!width || !height) return null;
              return (
                <Tree<FileNode>
                  data={treeData}
                  width={width}
                  height={height}
                  indent={16}
                  rowHeight={28}
                  overscanCount={6}
                  openByDefault={false}
                  disableDrag
                  disableDrop
                  onActivate={(node) => openFile(node.data.id)}
                >
                  {FileTreeRow}
                </Tree>
              );
            }}
          />
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-3">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">{name}</h1>
          </div>
          <p className="shrink-0 text-[10px] text-muted-foreground">Workspace · {projectId}</p>
        </header>

        {/* File tabs */}
        <div className="shrink-0 border-b border-border bg-sidebar px-2">
          <div className="flex h-9 items-end gap-1 overflow-x-auto py-1">
            {openFiles.length === 0 ? (
              <div className="px-2 py-1 text-[10px] text-muted-foreground">No file opened</div>
            ) : null}
            {openFiles.map((f) => {
              const isActive = f.id === activeId;
              return (
                <div
                  key={f.id}
                  onClick={() => setActiveId(f.id)}
                  className={cn(
                    "group relative flex flex-none items-center gap-2 border px-2 py-1 text-xs",
                    "max-w-[14rem] rounded-none",
                    isActive
                      ? "z-10 border-border bg-background text-foreground"
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
  const Icon = isFolder ? Folder : File;

  return (
    <div
      style={style}
      className={cn(
        "mx-2 flex cursor-default items-center gap-2 border border-transparent px-2 text-xs text-sidebar-foreground/90",
        node.isSelected ? "border-primary/40 bg-primary/10 text-primary" : "hover:border-sidebar-border hover:bg-secondary/40",
      )}
      onClick={() => node.select()}
      onDoubleClick={() => {
        if (isFolder) node.toggle();
        else node.activate();
      }}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isFolder ? "text-accent" : "text-muted-foreground")} aria-hidden="true" />
      <span className="truncate">{node.data.name}</span>
    </div>
  );
}
