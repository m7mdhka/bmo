"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import { AppPageShell } from "@/components/layout/app-page-shell";
import { Button } from "@/components/ui/button";
import type { TemplateRecord } from "@/lib/template-registry";

type TemplatesPageProps = {
  templates: TemplateRecord[];
};

export function TemplatesPage({ templates }: TemplatesPageProps) {
  const starter = templates[0];

  return (
    <AppPageShell
      eyebrow="starter"
      title="Web App Starter"
      description="BMO currently focuses on one local full-stack web app workflow: frontend, backend, preview, terminal, and Docker runtime in one project."
      iconName="Box"
      actions={
        <Button asChild size="sm" className="font-mono text-xs">
          <Link href="/projects/new">Create web app</Link>
        </Button>
      }
    >
      <div className="border border-primary/20 bg-primary/8 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Current focus:</span> one strong web app path now, with room to add more specialized starters later when the runtime model settles.
      </div>

      {starter ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="border border-border bg-card p-5 text-xs"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1 w-8 bg-primary" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Primary starter
            </span>
          </div>
          <h2 className="text-base font-semibold text-foreground">{starter.name}</h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
            {starter.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-1">
            <span className="border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {starter.language}
            </span>
            {starter.tags.map((tag) => (
              <span
                key={tag}
                className="border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="text-[10px] text-muted-foreground/80">
              <span>{starter.maintainedBy}</span>
              <span className="mx-2">·</span>
              <span>local-ready</span>
            </div>
            <div className="flex items-center gap-2">
              {starter.url ? (
                <Link
                  href={starter.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-accent transition-colors hover:text-accent-foreground"
                >
                  Source
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              ) : null}
              <Button asChild size="sm" className="font-mono text-xs">
                <Link href="/projects/new">Use starter</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AppPageShell>
  );
}
