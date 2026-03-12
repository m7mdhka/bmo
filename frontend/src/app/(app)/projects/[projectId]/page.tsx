import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ProjectWorkspacePageProps = {
  params: { projectId: string };
};

// Placeholder: later this will fetch real project/workspace data.
const mockProjectNames: Record<string, string> = {
  "local-notes": "Local Notes App",
  "landing-page": "Landing Page",
};

export default function ProjectWorkspacePage({
  params,
}: ProjectWorkspacePageProps) {
  const name = mockProjectNames[params.projectId];

  if (!name) {
    notFound();
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
          {name}
        </h1>
        <p className="text-xs text-muted-foreground">
          Workspace · {params.projectId}
        </p>
      </div>

      <Separator />

      <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,0.25fr)_minmax(0,0.5fr)_minmax(0,0.25fr)]">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em]">
              Files
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 text-xs text-muted-foreground">
            <p>File tree placeholder. Later this will show project files.</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em]">
              Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 text-xs text-muted-foreground">
            <p>
              Editor placeholder. A real code editor (e.g. Monaco/CodeMirror)
              will be mounted here.
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.15em]">
              Console
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 text-xs text-muted-foreground">
            <p>
              Logs / terminal placeholder. Later this will show process output
              for the current project.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

