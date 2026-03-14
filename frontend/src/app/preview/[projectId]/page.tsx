import { redirect } from "next/navigation";

import { getProject, getProjectPreviewUrl } from "@/lib/projects";
import { PreviewClient } from "./preview-client";

export const dynamic = "force-dynamic";

type PreviewPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  const previewUrl = project ? getProjectPreviewUrl(project) : null;

  if (previewUrl) {
    redirect(previewUrl);
  }

  return <PreviewClient projectId={projectId} />;
}
