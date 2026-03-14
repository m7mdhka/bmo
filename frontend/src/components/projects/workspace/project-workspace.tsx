"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Loader2, MoreHorizontal, Settings2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
  treeData,
  previewUrl,
  projectStatus,
}: {
  projectId: string;
  treeData: FileNode[];
  previewUrl: string | null;
  projectStatus: "running" | "stopped";
}) {
  const router = useRouter();
  const byId = useMemo(() => flattenFiles(treeData), [treeData]);
  const defaultFile = useMemo(() => {
    const preferred = Array.from(byId.values()).find((node) => node.type === "file" && node.name.toLowerCase() === "readme.md");
    if (preferred?.type === "file") return preferred;
    return Array.from(byId.values()).find((node) => node.type === "file") ?? null;
  }, [byId]);

  const [openFiles, setOpenFiles] = useState<OpenFile[]>(() =>
    defaultFile && defaultFile.type === "file"
      ? [{ id: defaultFile.id, title: defaultFile.name, language: defaultFile.language, content: defaultFile.content ?? "" }]
      : [],
  );
  const [activeId, setActiveId] = useState(defaultFile?.type === "file" ? defaultFile.id : "");
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

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

  function moveFileTab(fromId: string, toId: string) {
    if (fromId === toId) return;
    setOpenFiles((prev) => {
      const fromIndex = prev.findIndex((f) => f.id === fromId);
      const toIndex = prev.findIndex((f) => f.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved!);
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

  async function handleProjectAction(action: "start" | "stop" | "restart" | "delete") {
    setActionInFlight(action);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed to delete project.");
        router.push("/projects");
        router.refresh();
        return;
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Project action failed.");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Project action failed.");
    } finally {
      setActionInFlight(null);
    }
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
                <div className="min-w-0 flex-1">
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
                </div>

                <div className="flex items-center gap-1 pb-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center border",
                          "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
                        )}
                        aria-label="Project settings"
                        title="Project settings"
                      >
                        {actionInFlight ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Settings2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Project</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {projectStatus === "running" ? (
                        <DropdownMenuItem disabled={!!actionInFlight} onSelect={() => handleProjectAction("stop")}>
                          Stop project
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled={!!actionInFlight} onSelect={() => handleProjectAction("start")}>
                          Start project
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem disabled={!!actionInFlight} onSelect={() => handleProjectAction("restart")}>
                        Restart project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={!!actionInFlight}
                        className="text-destructive focus:text-destructive"
                        onSelect={() => {
                          if (window.confirm(`Delete project "${projectId}"? This removes the local files and stops its containers.`)) {
                            void handleProjectAction("delete");
                          }
                        }}
                      >
                        Delete project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

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
                </div>
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
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.effectAllowed = "move";
                                      e.dataTransfer.setData("text/plain", f.id);
                                      setDraggingTabId(f.id);
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.dataTransfer.dropEffect = "move";
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      const fromId = e.dataTransfer.getData("text/plain");
                                      moveFileTab(fromId, f.id);
                                      setDraggingTabId(null);
                                    }}
                                    onDragEnd={() => setDraggingTabId(null)}
                                    className={cn(draggingTabId === f.id && "opacity-60")}
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
                <WorkspacePreviewPanel key={projectId} projectId={projectId} previewUrl={previewUrl} />
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
