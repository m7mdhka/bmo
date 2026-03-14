"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Users, Search, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppPageShell } from "@/components/layout/app-page-shell";
import type { TemplateRecord, TemplateSource } from "@/lib/template-registry";

type TemplatesPageProps = {
  templates: TemplateRecord[];
};

const SOURCE_META: Record<TemplateSource | "all", { label: string; icon?: typeof Globe2 }> = {
  all: { label: "All" },
  official: { label: "Official", icon: Globe2 },
  community: { label: "Community", icon: Users },
};

export function TemplatesPage({ templates }: TemplatesPageProps) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<TemplateSource | "all">("all");

  const sources = useMemo(() => {
    const present = new Set(templates.map((template) => template.source));
    return (["all", "official", "community"] as const)
      .filter((id) => id === "all" || present.has(id))
      .map((id) => ({ id, ...SOURCE_META[id] }));
  }, [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((tpl) => {
      if (source !== "all" && tpl.source !== source) return false;
      if (!q) return true;
      const haystack = (
        tpl.name +
        " " +
        tpl.description +
        " " +
        tpl.tags.join(" ") +
        " " +
        tpl.language
      ).toLowerCase();
      return haystack.includes(q);
    });
  }, [query, source, templates]);

  return (
    <AppPageShell
      eyebrow="templates"
      title="Starter templates"
      description="Pick from the template manifests available in this BMO workspace."
      iconName="Box"
      actions={
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="search templates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 w-52 border border-border bg-card pl-6 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none"
          />
        </div>
      }
    >

      {/* Source filter pills */}
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <span className="mr-1 text-[9px] uppercase tracking-[0.18em]">
          Source
        </span>
        {sources.map((s) => (
          <button
            key={s.id}
            onClick={() => setSource(s.id as TemplateSource | "all")}
            className={cn(
              "flex items-center gap-1 border px-2 py-0.5 transition-colors",
              source === s.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            )}
          >
            {s.icon ? <s.icon className="h-3 w-3" aria-hidden /> : null}
            <span>{s.label}</span>
          </button>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground/60">
          {filtered.length} template{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Templates grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${source}-${query}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((tpl, index) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.04 }}
              className="border border-border bg-card p-4 text-xs transition-colors hover:border-primary/40 hover:bg-secondary/60"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    "h-1 w-8",
                    tpl.source === "official"
                      ? "bg-primary"
                      : "bg-accent",
                  )}
                />
                <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  {tpl.source === "official" ? "Official" : "Community"}
                </span>
              </div>
              <h2 className="truncate text-sm font-semibold text-foreground">
                {tpl.name}
              </h2>
              <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                {tpl.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-1">
                <span className="border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  {tpl.language}
                </span>
                {tpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/80">
                <span>{tpl.maintainedBy}</span>
                <span>local-ready</span>
              </div>

              {tpl.url && (
                <div className="mt-3 text-right text-[10px]">
                  <Link
                    href={tpl.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-accent transition-colors hover:text-accent-foreground"
                  >
                    Source
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </AppPageShell>
  );
}
