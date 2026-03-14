import { TemplatesPage } from "@/components/templates/templates-page";
import { loadTemplates } from "@/lib/template-registry";

export const metadata = {
  title: "Web App Starter · BMO",
};

export const dynamic = "force-dynamic";

export default async function TemplatesRoute() {
  const templates = await loadTemplates();
  return <TemplatesPage templates={templates} />;
}
