import { ProjectCard, type Project } from "@/components/projects/project-card";
import { StatsBar } from "@/components/projects/stats-bar";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { listProjects, toProjectCard } from "@/lib/projects";
import { OrchestratorUnavailableError } from "@/lib/orchestrator-api";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let orchestratorUnavailable = false;
  try {
    projects = (await listProjects()).map(toProjectCard);
  } catch (error) {
    if (error instanceof OrchestratorUnavailableError) {
      orchestratorUnavailable = true;
    } else {
      throw error;
    }
  }
  return (
    <AppPageShell
      eyebrow={`~/workspace · ${projects.length} project${projects.length !== 1 ? "s" : ""}`}
      title="Projects"
      iconName="FolderKanban"
      actions={
        <>
          <div className="relative hidden sm:block">
            <Search className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="filter projects..."
              className="h-7 w-44 border border-border bg-card pl-6.5 pr-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none"
            />
          </div>
          <Button asChild size="sm" className="gap-1.5 font-mono text-xs">
            <Link href="/projects/new">
              <Plus className="h-3 w-3" aria-hidden />
              New project
            </Link>
          </Button>
        </>
      }
    >
      <StatsBar />
      {orchestratorUnavailable ? (
        <div className="border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          BMO orchestrator is not running. Start the backend service or `docker compose -f docker/docker-compose.yml up` to load projects and runtimes.
        </div>
      ) : null}
      {projects.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center border border-dashed border-border bg-card/50 px-6 text-center">
          <div className="max-w-md space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Empty Workspace
            </p>
            <h2 className="text-lg font-semibold text-foreground">No projects yet</h2>
            <p className="text-sm text-muted-foreground">
              Create your first web app project to open it in the workspace, run its stack, and start editing files.
            </p>
            <Button asChild size="sm" className="mt-2 gap-1.5 font-mono text-xs">
              <Link href="/projects/new">
                <Plus className="h-3 w-3" aria-hidden />
                Create project
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      )}
    </AppPageShell>
  );
}
