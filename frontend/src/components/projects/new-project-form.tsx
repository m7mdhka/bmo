"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TemplateRecord } from "@/lib/template-registry";
import type { PortCheckResult } from "@/lib/projects";

type TemplateCard = Omit<TemplateRecord, "icon"> & {
  iconKey: string;
  icon: React.ElementType;
  color: string;
};

const ICON_BY_KEY: Record<string, React.ElementType> = {
  nextjs: Globe,
  fastapi: Server,
  python: Cpu,
  html: FileCode2,
  markdown: FileText,
  blank: Package,
  frontend: Globe,
  backend: Server,
  cli: Cpu,
  content: FileText,
};

const COLOR_BY_KEY: Record<string, string> = {
  nextjs: "#89dceb",
  fastapi: "#a6e3a1",
  python: "#a6e3a1",
  html: "#fab387",
  markdown: "#f9e2af",
  blank: "#6c7086",
  frontend: "#89dceb",
  backend: "#a6e3a1",
  cli: "#f9e2af",
  content: "#f9e2af",
};

const FADE_UP = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  // Numeric easing avoids type mismatches across framer-motion versions.
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
};

/* ─── Main form ───────────────────────────────────────────────────────── */

export function NewProjectForm({ templates }: { templates: TemplateRecord[] }) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("~/bmo-projects/");
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState("");
  const [portDialog, setPortDialog] = useState<PortCheckResult | null>(null);
  const [selectedPorts, setSelectedPorts] = useState({ frontendPort: 3000, backendPort: 4000 });
  const [countdown, setCountdown] = useState(20);
  const [dialogError, setDialogError] = useState("");
  const autoSubmitRef = useRef(false);

  const cards: TemplateCard[] = templates.map((template) => ({
    ...template,
    iconKey: template.icon,
    icon: ICON_BY_KEY[template.icon] ?? ICON_BY_KEY[template.category] ?? Package,
    color: COLOR_BY_KEY[template.icon] ?? COLOR_BY_KEY[template.category] ?? "#6c7086",
  }));

  const template = cards.find((t) => t.id === selectedTemplate);

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

  async function submitProject(frontendPort?: number, backendPort?: number, fromDialog = false) {
    if (!template) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: name,
          description,
          templateId: template.id,
          templateName: template.name,
          language: template.language,
          path,
          frontendPort,
          backendPort,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (fromDialog) {
          setDialogError(data.error ?? "Failed to create project.");
        } else {
          setNameError(data.error ?? "Failed to create project.");
        }
        setCreating(false);
        return;
      }
      setPortDialog(null);
      router.push(`/projects/${name}`);
      router.refresh();
    } catch {
      if (fromDialog) setDialogError("Failed to create project.");
      else setNameError("Failed to create project.");
      setCreating(false);
    }
  }

  const submitProjectEvent = useEffectEvent(async (frontendPort?: number, backendPort?: number, fromDialog = false) => {
    await submitProject(frontendPort, backendPort, fromDialog);
  });

  useEffect(() => {
    if (!portDialog) return;
    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return current - 1;
      });

      if (autoSubmitRef.current) return;
      if (countdown <= 1) {
        autoSubmitRef.current = true;
        void submitProjectEvent(portDialog.suggested.frontendPort, portDialog.suggested.backendPort, true);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [countdown, portDialog]);

  async function handleCreate() {
    if (!validateStep2()) return;
    if (!template) return;
    setCreating(true);
    setNameError("");
    setDialogError("");
    try {
      const res = await fetch("/api/projects/ports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ frontendPort: 3000, backendPort: 4000 }),
      });
      const data = (await res.json()) as PortCheckResult & { error?: string };
      if (!res.ok) {
        setNameError(data.error ?? "Failed to check ports.");
        setCreating(false);
        return;
      }
      if (data.conflicts.length > 0) {
        autoSubmitRef.current = false;
        setCountdown(20);
        setSelectedPorts(data.suggested);
        setPortDialog(data);
        return;
      }
      await submitProject(data.suggested.frontendPort, data.suggested.backendPort);
    } catch {
      setNameError("Failed to check ports.");
      setCreating(false);
    }
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
              {cards.map((tpl, i) => {
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

      <Dialog
        open={!!portDialog}
        onOpenChange={(open) => {
          if (!open && !autoSubmitRef.current) {
            setPortDialog(null);
            setCreating(false);
            setDialogError("");
          }
        }}
      >
        <DialogContent showCloseButton={!creating}>
          <DialogHeader>
            <DialogTitle>Port Conflict</DialogTitle>
            <DialogDescription>
              Some default ports are already in use. BMO found free ports for this project and will continue in {countdown}s unless you change them.
            </DialogDescription>
          </DialogHeader>

          {portDialog ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Frontend port">
                  <input
                    type="number"
                    value={selectedPorts.frontendPort}
                    onChange={(e) => setSelectedPorts((current) => ({ ...current, frontendPort: Number(e.target.value) || 0 }))}
                    className="w-full border border-border bg-card px-3 py-2 font-mono text-xs text-foreground focus:border-primary/60 focus:outline-none"
                  />
                </Field>
                <Field label="Backend port">
                  <input
                    type="number"
                    value={selectedPorts.backendPort}
                    onChange={(e) => setSelectedPorts((current) => ({ ...current, backendPort: Number(e.target.value) || 0 }))}
                    className="w-full border border-border bg-card px-3 py-2 font-mono text-xs text-foreground focus:border-primary/60 focus:outline-none"
                  />
                </Field>
              </div>

              <div className="border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
                {portDialog.conflicts.map((conflict) => (
                  <p key={conflict.key}>
                    {conflict.key === "frontendPort" ? "Frontend" : "Backend"} port {conflict.desired} is occupied. Suggested: {conflict.suggested}
                  </p>
                ))}
              </div>

              {dialogError ? <p className="text-xs text-destructive">{dialogError}</p> : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={creating}
              onClick={() => {
                setPortDialog(null);
                setCreating(false);
                setDialogError("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={creating}
              onClick={() => {
                setCountdown(0);
                void submitProject(selectedPorts.frontendPort, selectedPorts.backendPort, true);
              }}
            >
              Change
            </Button>
            <Button
              disabled={creating}
              onClick={() => {
                setCountdown(0);
                void submitProject(portDialog?.suggested.frontendPort, portDialog?.suggested.backendPort, true);
              }}
            >
              Continue{countdown > 0 ? ` (${countdown})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
