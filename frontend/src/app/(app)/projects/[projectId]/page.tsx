import { notFound } from "next/navigation";

import { ProjectWorkspace } from "@/components/projects/workspace/project-workspace";
import { getProject, getProjectPreviewUrl, getProjectRuntime, getProjectTree } from "@/lib/projects";

export const dynamic = "force-dynamic";

type ProjectWorkspacePageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectWorkspacePage({
  params,
}: ProjectWorkspacePageProps) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  const treeData = await getProjectTree(projectId);
  const runtime = project ? await getProjectRuntime(projectId) : null;

  if (!project || !treeData || !runtime) {
    notFound();
  }

  return (
    <ProjectWorkspace
      key={projectId}
      projectId={projectId}
      treeData={treeData}
      previewUrl={project.status === "running" && runtime.previewService ? getProjectPreviewUrl(project) : null}
      projectStatus={project.status}
      runtimeInfo={runtime}
    />
  );
}
