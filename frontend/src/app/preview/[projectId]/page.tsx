import { redirect } from "next/navigation";

import { getProject } from "@/lib/projects";
import { PreviewClient } from "./preview-client";

export const dynamic = "force-dynamic";

type PreviewPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (project?.frontendPort) {
    redirect(`http://localhost:${project.frontendPort}`);
  }

  return <PreviewClient projectId={projectId} />;
}
