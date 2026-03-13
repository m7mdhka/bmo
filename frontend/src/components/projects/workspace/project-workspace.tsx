"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { MoreHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { WorkspaceTabsRoot, WorkspaceTabsList, WorkspaceTab } from "./workspace-tabs";
import { WorkspaceHeader } from "./workspace-header";

import type { FileNode, OpenFile } from "./workspace-types";
import { WorkspaceAgentPanel } from "./workspace-agent-panel";
import { WorkspaceDatabasePanel } from "./workspace-database-panel";
import { WorkspaceFilesPanel } from "./workspace-files-panel";
import { WorkspacePreviewPanel } from "./workspace-preview-panel";
import { WorkspaceTerminal } from "./workspace-terminal";

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

type FeatureId = "IDE" | "Preview" | "Auth" | "Database";

const FEATURE_LABEL: Record<FeatureId, string> = {
  IDE: "IDE",
  Preview: "Preview",
  Auth: "Auth",
  Database: "Database",
};

type FeatureTabsState = {
  open: FeatureId[];
  active: FeatureId;
};

type FeatureTabsAction =
  | { type: "activate"; id: FeatureId }
  | { type: "toggle"; id: FeatureId; open: boolean }
  | { type: "close"; id: FeatureId };

function featureTabsReducer(state: FeatureTabsState, action: FeatureTabsAction): FeatureTabsState {
  const ensureNonEmpty = (open: FeatureId[]) => (open.length ? open : (["IDE"] as FeatureId[]));

  if (action.type === "activate") {
    return state.open.includes(action.id) ? { ...state, active: action.id } : state;
  }

  if (action.type === "toggle") {
    const has = state.open.includes(action.id);
    if (action.open) {
      if (has) return { ...state, active: action.id };
      return { open: [...state.open, action.id], active: action.id };
    }

    if (!has) return state;
    const nextOpen = ensureNonEmpty(state.open.filter((x) => x !== action.id));
    const nextActive = nextOpen.includes(state.active) ? state.active : nextOpen[0]!;
    return { open: nextOpen, active: nextActive };
  }

  // close
  if (!state.open.includes(action.id)) return state;
  const nextOpen = ensureNonEmpty(state.open.filter((x) => x !== action.id));
  const nextActive = nextOpen.includes(state.active) ? state.active : nextOpen[0]!;
  return { open: nextOpen, active: nextActive };
}

export function ProjectWorkspace({
  projectId,
}: {
  projectId: string;
}) {
  const treeData = useMemo(() => buildMockTree(projectId), [projectId]);
  const byId = useMemo(() => flattenFiles(treeData), [treeData]);

  const [openFiles, setOpenFiles] = useState<OpenFile[]>(() => [
    { id: "file-readme", title: "README.md", language: "markdown", content: byId.get("file-readme")?.content ?? "" },
  ]);
  const [activeId, setActiveId] = useState(openFiles[0]?.id ?? "");

  const [features, dispatchFeatures] = useReducer(featureTabsReducer, {
    open: ["IDE"],
    active: "IDE",
  });

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

  function toggleFeature(id: FeatureId, open: boolean) {
    dispatchFeatures({ type: "toggle", id, open });
  }

  function closeFeature(id: FeatureId) {
    dispatchFeatures({ type: "close", id });
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* Outer split: Agent | Main */}
      <ResizablePanelGroup orientation="horizontal" className="h-full min-w-0 flex-1 overflow-hidden">
        <ResizablePanel
          id="agent"
          defaultSize="26%"
          minSize="280px"
          maxSize="520px"
          className="min-w-0 bg-sidebar text-sidebar-foreground"
          style={{ overflow: "hidden" }}
        >
          <WorkspaceAgentPanel projectId={projectId} />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel
          id="main"
          defaultSize="74%"
          minSize="520px"
          className="min-w-0 bg-background"
          style={{ overflow: "hidden" }}
        >
          <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
            {/* Feature tabs (aligned with Agent header row) */}
            <WorkspaceTabsRoot
              value={features.active}
              onValueChange={(value: string) => {
                if (
                  value === "IDE" ||
                  value === "Preview" ||
                  value === "Auth" ||
                  value === "Database"
                ) {
                  dispatchFeatures({ type: "activate", id: value });
                }
              }}
            >
              <WorkspaceHeader className="h-10 items-end px-2">
                <WorkspaceTabsList>
                  {features.open.map((id) => {
                    const canClose = features.open.length > 1;
                    return (
                      <WorkspaceTab
                        key={id}
                        value={id}
                        closeButton={
                          canClose ? (
                            <X
                              className="h-3 w-3"
                              aria-hidden="true"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                closeFeature(id);
                              }}
                            />
                          ) : undefined
                        }
                      >
                        {FEATURE_LABEL[id]}
                      </WorkspaceTab>
                    );
                  })}
                </WorkspaceTabsList>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center border",
                        "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
                      )}
                      aria-label="Options"
                      title="Options"
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Features</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(Object.keys(FEATURE_LABEL) as FeatureId[]).map((id) => (
                      <DropdownMenuCheckboxItem
                        key={id}
                        checked={features.open.includes(id)}
                        disabled={features.open.length === 1 && features.open.includes(id)}
                        onCheckedChange={(v) => toggleFeature(id, Boolean(v))}
                      >
                        {FEATURE_LABEL[id]}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </WorkspaceHeader>
            </WorkspaceTabsRoot>

            {/* Inner split: Files | Editor */}
            <div className="min-h-0 flex-1">
              {features.active === "IDE" ? (
                <ResizablePanelGroup orientation="horizontal" className="h-full min-w-0 flex-1 overflow-hidden">
                  <ResizablePanel
                    id="files"
                    defaultSize="28%"
                    minSize="240px"
                    maxSize="35%"
                  className="min-w-0 bg-sidebar text-sidebar-foreground"
                  style={{ overflow: "hidden" }}
                >
                    <WorkspaceFilesPanel treeData={treeData} onOpenFile={openFile} activeFileId={activeId} />
                  </ResizablePanel>

                  <ResizableHandle />

                  <ResizablePanel
                    id="editor"
                    defaultSize="72%"
                    minSize="320px"
                    maxSize="85%"
                    className="min-w-0 bg-background"
                    style={{ overflow: "hidden" }}
                  >
                    <ResizablePanelGroup orientation="vertical" className="h-full min-w-0 flex-1 overflow-hidden">
                      <ResizablePanel id="editorTop" defaultSize="72%" minSize="240px" maxSize="90%" style={{ overflow: "hidden" }}>
                        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                          {/* File tabs */}
                          <WorkspaceTabsRoot value={activeId} onValueChange={(value: string) => setActiveId(value)}>
                            <div className="shrink-0 flex h-10 items-end border-b border-sidebar-border bg-sidebar px-2">
                              <WorkspaceTabsList ref={tabsStripRef}>
                                {openFiles.length === 0 ? (
                                  <div className="px-2 pb-1 text-[10px] text-muted-foreground">No file opened</div>
                                ) : null}
                                {openFiles.map((f) => (
                                  <WorkspaceTab
                                    key={f.id}
                                    value={f.id}
                                    data-tab-id={f.id}
                                    closeButton={
                                      <X
                                        className="h-3 w-3"
                                        aria-hidden="true"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          closeFile(f.id);
                                        }}
                                      />
                                    }
                                  >
                                    {f.title}
                                  </WorkspaceTab>
                                ))}
                              </WorkspaceTabsList>
                            </div>
                          </WorkspaceTabsRoot>

                          {/* Editor */}
                          <div className="min-h-0 flex-1 overflow-hidden">
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
                      </ResizablePanel>

                      <ResizableHandle orientation="vertical" />

                      <ResizablePanel id="terminal" defaultSize="28%" minSize="140px" maxSize="55%" style={{ overflow: "hidden" }}>
                        <WorkspaceTerminal projectId={projectId} />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : features.active === "Preview" ? (
                <WorkspacePreviewPanel key={projectId} projectId={projectId} />
              ) : features.active === "Database" ? (
                <WorkspaceDatabasePanel />
              ) : (
                <div className="flex h-full items-center justify-center bg-background text-xs text-muted-foreground">
                  {features.active} view placeholder.
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
