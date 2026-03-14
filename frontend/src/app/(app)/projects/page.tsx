import { ProjectCard, type Project } from "@/components/projects/project-card";
import { StatsBar } from "@/components/projects/stats-bar";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { listProjects, toProjectCard } from "@/lib/projects";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects: Project[] = (await listProjects()).map(toProjectCard);
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
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>
    </AppPageShell>
  );
}
