"use client";

import { ProjectCard, type Project } from "@/components/projects/project-card";
import { StatsBar } from "@/components/projects/stats-bar";
import { AppPageShell } from "@/components/layout/app-page-shell";
import Link from "next/link";
import { FolderKanban, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockProjects: Project[] = [
  {
    id: "local-notes",
    name: "local-notes",
    description: "Simple markdown notes app running locally on port 3001.",
    path: "~/bmo-projects/local-notes",
    lastOpened: "just now",
    lang: "TypeScript",
    status: "running",
  },
  {
    id: "landing-page",
    name: "landing-page",
    description: "Static marketing site built with Next.js and Tailwind CSS.",
    path: "~/bmo-projects/landing-page",
    lastOpened: "2h ago",
    lang: "TypeScript",
    status: "stopped",
  },
  {
    id: "api-service",
    name: "api-service",
    description: "FastAPI backend with async endpoints and auto-generated docs.",
    path: "~/bmo-projects/api-service",
    lastOpened: "yesterday",
    lang: "Python",
    status: "stopped",
  },
];

export default function ProjectsPage() {
  return (
    <AppPageShell
      eyebrow={`~/workspace · ${mockProjects.length} project${mockProjects.length !== 1 ? "s" : ""}`}
      title="Projects"
      icon={FolderKanban}
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
      footer={
        <p className="text-[10px] text-muted-foreground/40">
          Projects are stored locally. Nothing leaves your machine.
        </p>
      }
    >
      <StatsBar />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>
    </AppPageShell>
  );
}
