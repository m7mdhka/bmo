import { notFound } from "next/navigation";

import { ProjectWorkspace } from "@/components/projects/workspace/project-workspace";
import { getProject, getProjectTree } from "@/lib/projects";

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

  if (!project || !treeData) {
    notFound();
  }

  return (
    <ProjectWorkspace
      key={projectId}
      projectId={projectId}
      treeData={treeData}
      previewUrl={project.frontendPort ? `http://localhost:${project.frontendPort}` : null}
      projectStatus={project.status}
    />
  );
}
