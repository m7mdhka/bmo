"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FolderOpen, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Project = {
  id: string;
  name: string;
  description: string;
  path: string;
  lastOpened: string;
  lang?: string;
  status?: "running" | "stopped";
};

const LANG_COLOR: Record<string, string> = {
  Python: "#a6e3a1",
  TypeScript: "#89dceb",
  JavaScript: "#f9e2af",
  Rust: "#fab387",
  Go: "#89dceb",
};

type ProjectCardProps = {
  project: Project;
  index: number;
};

export function ProjectCard({ project, index }: ProjectCardProps) {
  const langColor = project.lang ? LANG_COLOR[project.lang] ?? "#6c7086" : "#6c7086";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: "easeOut" }}
    >
      <Link href={`/projects/${project.id}`} className="group block">
        <div
          className={cn(
            "relative border border-border bg-card p-4 transition-colors duration-150",
            "hover:border-primary/50 hover:bg-secondary/60",
          )}
        >
          {/* left accent bar */}
          <span
            className="absolute inset-y-0 left-0 w-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            style={{ background: langColor }}
          />

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {project.name}
                </h3>
                {project.status === "running" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#a6e3a1]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a6e3a1] opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#a6e3a1]" />
                    </span>
                    running
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {project.description}
              </p>
            </div>
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5 text-[10px] text-muted-foreground">
            <span className="truncate font-mono">{project.path}</span>
            <div className="flex shrink-0 items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              <span>{project.lastOpened}</span>
            </div>
          </div>

          {project.lang && (
            <span
              className="mt-2 inline-block border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest"
              style={{ color: langColor, borderColor: `${langColor}40` }}
            >
              {project.lang}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
