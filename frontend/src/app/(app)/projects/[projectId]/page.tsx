import { notFound } from "next/navigation";

import { ProjectWorkspace } from "@/components/projects/workspace/project-workspace";

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

  return <ProjectWorkspace projectId={projectId} name={name} />;
}
