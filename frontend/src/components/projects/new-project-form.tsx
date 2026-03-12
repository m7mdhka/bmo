"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  ChevronRight,
  Check,
  Loader2,
  FileCode2,
  Globe,
  Server,
  Cpu,
  FileText,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ─── Template definitions ────────────────────────────────────────────── */

type Template = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  lang: string;
  color: string;
  tags: string[];
};

const TEMPLATES: Template[] = [
  {
    id: "nextjs",
    name: "Next.js App",
    description: "Full-stack React app with App Router, TypeScript and Tailwind.",
    icon: Globe,
    lang: "TypeScript",
    color: "#89dceb",
    tags: ["React", "TypeScript", "Tailwind"],
  },
  {
    id: "fastapi",
    name: "FastAPI Service",
    description: "Python REST API with auto-generated OpenAPI docs and async support.",
    icon: Server,
    lang: "Python",
    color: "#a6e3a1",
    tags: ["Python", "REST", "OpenAPI"],
  },
  {
    id: "cli-python",
    name: "Python CLI",
    description: "Command-line tool with argument parsing, logging and packaging.",
    icon: Cpu,
    lang: "Python",
    color: "#a6e3a1",
    tags: ["Python", "CLI"],
  },
  {
    id: "static-site",
    name: "Static Site",
    description: "Plain HTML/CSS/JS site with zero dependencies, ready to deploy.",
    icon: FileCode2,
    lang: "HTML",
    color: "#fab387",
    tags: ["HTML", "CSS", "JS"],
  },
  {
    id: "markdown-notes",
    name: "Markdown Notes",
    description: "Local notes workspace with live preview.",
    icon: FileText,
    lang: "Markdown",
    color: "#f9e2af",
    tags: ["Markdown"],
  },
  {
    id: "blank",
    name: "Blank project",
    description: "Empty directory. You bring your own setup.",
    icon: Package,
    lang: "Any",
    color: "#6c7086",
    tags: [],
  },
];

const FADE_UP = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  // Numeric easing avoids type mismatches across framer-motion versions.
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
};

/* ─── Main form ───────────────────────────────────────────────────────── */

export function NewProjectForm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("~/bmo-projects/");
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState("");

  const template = TEMPLATES.find((t) => t.id === selectedTemplate);

  function handleNameChange(v: string) {
    const slug = v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setName(slug);
    setPath(`~/bmo-projects/${slug}`);
    setNameError("");
  }

  function handleSelectTemplate(id: string) {
    setSelectedTemplate(id);
    setStep(2);
  }

  function validateStep2(): boolean {
    if (!name.trim()) {
      setNameError("Project name is required.");
      return false;
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      setNameError("Use lowercase letters, numbers and hyphens only.");
      return false;
    }
    return true;
  }

  async function handleCreate() {
    if (!validateStep2()) return;
    setCreating(true);
    // Simulate async creation — later calls the backend API
    await new Promise((r) => setTimeout(r, 1200));
    router.push(`/projects/${name}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl font-mono">
      {/* ── Breadcrumb ── */}
      <motion.div {...FADE_UP} className="mb-5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span
          className={cn("cursor-pointer transition-colors hover:text-foreground", step === 1 && "text-primary")}
          onClick={() => setStep(1)}
        >
          01 · template
        </span>
        <ChevronRight className="h-2.5 w-2.5 shrink-0" />
        <span className={cn("transition-colors", step === 2 ? "text-primary" : "opacity-40")}>
          02 · configure
        </span>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <h2 className="mb-1 text-base font-bold tracking-tight text-foreground">
              Choose a template
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Select a starting point for your project.
            </p>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((tpl, i) => {
                const Icon = tpl.icon;
                return (
                  <motion.button
                    key={tpl.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: i * 0.05 }}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className="group relative border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-secondary/60"
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ background: tpl.color }}
                    />
                    <Icon
                      className="mb-2 h-4 w-4"
                      style={{ color: tpl.color }}
                      aria-hidden
                    />
                    <p className="text-xs font-semibold text-foreground">{tpl.name}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {tpl.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {tpl.tags.map((tag) => (
                        <span
                          key={tag}
                          className="border px-1 py-0.5 text-[9px] uppercase tracking-widest"
                          style={{ color: tpl.color, borderColor: `${tpl.color}40` }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <ChevronRight className="absolute top-4 right-3 h-3.5 w-3.5 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && template && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* Selected template badge */}
            <div className="flex items-center gap-2 border border-border bg-card px-3 py-2 text-xs">
              <template.icon
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: template.color }}
                aria-hidden
              />
              <span className="text-muted-foreground">Template:</span>
              <span className="font-semibold text-foreground">{template.name}</span>
              <button
                onClick={() => { setStep(1); setSelectedTemplate(""); }}
                className="ml-auto text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              >
                change
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <Field label="Project name" required error={nameError}>
                <input
                  autoFocus
                  type="text"
                  placeholder="my-awesome-project"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={cn(
                    "w-full border bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none",
                    nameError ? "border-destructive focus:border-destructive" : "border-border focus:border-primary/60",
                  )}
                />
              </Field>

              <Field label="Description">
                <input
                  type="text"
                  placeholder="A short description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-border bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/60 focus:outline-none"
                />
              </Field>

              <Field
                label="Local path"
                hint="Where this project will live on your machine."
              >
                <div className="flex items-center border border-border bg-card px-3 py-2">
                  <FolderOpen className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    className="flex-1 bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                </div>
              </Field>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="gap-2 font-mono text-xs"
              >
                {creating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                )}
                {creating ? "Creating…" : "Create project"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-xs text-muted-foreground"
                onClick={() => router.push("/projects")}
                disabled={creating}
              >
                cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Field wrapper ───────────────────────────────────────────────────── */

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </label>
        {required && <span className="text-[10px] text-primary">*</span>}
      </div>
      {children}
      {hint && !error && (
        <p className="text-[10px] text-muted-foreground/50">{hint}</p>
      )}
      {error && (
        <p className="text-[10px] text-destructive">{error}</p>
      )}
    </div>
  );
}
