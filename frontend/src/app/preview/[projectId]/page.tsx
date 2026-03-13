import { PreviewClient } from "./preview-client";

type PreviewPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { projectId } = await params;

  return <PreviewClient projectId={projectId} />;
}
