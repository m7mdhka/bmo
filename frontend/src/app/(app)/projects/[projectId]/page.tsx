import { notFound } from "next/navigation";

import { Separator } from "@/components/ui/separator";

type ProjectWorkspacePageProps = {
  params: Promise<{ projectId: string }>;
};

// Placeholder: later this will fetch real project/workspace data.
const mockProjectNames: Record<string, string> = {
  "local-notes": "Local Notes App",
  "landing-page": "Landing Page",
};

export default async function ProjectWorkspacePage({
  params,
}: ProjectWorkspacePageProps) {
  const { projectId } = await params;
  const name = mockProjectNames[projectId];

  if (!name) {
    notFound();
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* File tree (left) */}
      <aside className="w-72 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-10 items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Files</span>
          <span className="font-mono text-[10px] text-muted-foreground/60">
            {projectId}
          </span>
        </div>
        <Separator />
        <div className="h-[calc(100%-2.5rem)] overflow-auto px-3 py-3 text-xs text-muted-foreground">
          <p>File tree placeholder. Later this will show project files.</p>
        </div>
      </aside>

      {/* IDE (right) */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header only above IDE */}
        <header className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-3">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
              {name}
            </h1>
          </div>
          <p className="shrink-0 text-[10px] text-muted-foreground">
            Workspace · {projectId}
          </p>
        </header>

        <div className="flex-1 overflow-auto p-3 text-xs text-muted-foreground">
          <p>
            IDE placeholder. A real code editor (e.g. Monaco/CodeMirror) will be
            mounted here.
          </p>
        </div>
      </section>
    </div>
  );
}
