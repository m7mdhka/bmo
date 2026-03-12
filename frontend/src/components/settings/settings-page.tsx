"use client";

import { useState } from "react";
import {
  Bot,
  Check,
  FolderOpen,
  Gauge,
  Layers,
  Settings,
  TerminalSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppPageShell } from "@/components/layout/app-page-shell";

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 border border-border bg-card px-3 py-2 text-left text-xs hover:border-primary/40 hover:bg-secondary/60"
    >
      <div>
        <p className="font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
      </div>
      <span
        className={cn(
          "flex h-4 w-7 items-center border border-border bg-background transition-colors",
          checked && "border-primary bg-primary/20",
        )}
      >
        <span
          className={cn(
            "flex h-3.5 w-3.5 items-center justify-center bg-card text-[9px] transition-transform",
            checked ? "translate-x-3 text-primary" : "translate-x-0 text-muted-foreground",
          )}
        >
          {checked && <Check className="h-2.5 w-2.5" aria-hidden />}
        </span>
      </span>
    </button>
  );
}

export function SettingsPage() {
  const [workspacePath, setWorkspacePath] = useState<string>("~/bmo-projects");

  const [activeSection, setActiveSection] = useState<
    "general" | "agents" | "templates" | "runtime" | "diagnostics"
  >("general");

  const [agentsCanEditFiles, setAgentsCanEditFiles] = useState(true);
  const [agentsCanRunCommands, setAgentsCanRunCommands] = useState(false);
  const [communityTemplates, setCommunityTemplates] = useState(true);
  const [telemetry, setTelemetry] = useState(false);

  return (
    <AppPageShell
      eyebrow="settings"
      title="Preferences"
      description="Settings apply to this local BMO instance only."
      icon={Settings}
      footer={
        <div className="flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground/60">
          <span>Changes are saved to this machine only.</span>
          <Button
            variant="outline"
            size="xs"
            className="px-2 py-1 text-[10px]"
            disabled
          >
            Reset to defaults (coming soon)
          </Button>
        </div>
      }
    >
      <div className="flex flex-1 gap-4">
        {/* Settings nav sidebar */}
        <nav className="flex w-40 flex-col gap-1 border border-border bg-card p-2 text-[11px]">
          {[
            { id: "general", label: "General" },
            { id: "agents", label: "Agents" },
            { id: "templates", label: "Templates" },
            { id: "runtime", label: "Runtime" },
            { id: "diagnostics", label: "Diagnostics" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id as typeof activeSection)}
              className={cn(
                "flex items-center justify-between border px-2 py-1 text-left transition-colors",
                activeSection === item.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Active section content */}
        <div className="flex-1 space-y-4">
          {activeSection === "general" && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                General
              </h2>
              <div className="space-y-2 text-xs">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Projects root
                </label>
                <div className="flex items-center border border-border bg-card px-3 py-2">
                  <FolderOpen className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <input
                    type="text"
                    value={workspacePath}
                    onChange={(e) => setWorkspacePath(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    placeholder="~/bmo-projects"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/60">
                  BMO will create and manage projects under this directory.
                </p>
              </div>
            </section>
          )}

          {activeSection === "agents" && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Bot className="h-3 w-3" aria-hidden />
                Agents & providers
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Control how AI agents behave in this workspace.
              </p>
              <div className="space-y-2">
                <ToggleRow
                  label="Allow agents to edit files"
                  description="Let agents apply code changes directly when you approve them."
                  checked={agentsCanEditFiles}
                  onChange={setAgentsCanEditFiles}
                />
                <ToggleRow
                  label="Allow agents to run commands"
                  description="Permit agents to run safe commands inside project containers."
                  checked={agentsCanRunCommands}
                  onChange={setAgentsCanRunCommands}
                />
              </div>
              <div className="space-y-2 text-[10px] text-muted-foreground/60">
                <p className="font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Providers (planned)
                </p>
                <p>
                  Future versions will let you register Claude, OpenAI or local providers
                  here and choose default models for coding assistance.
                </p>
                <p>
                  For now, provider configuration will live in files like{" "}
                  <code className="rounded bg-secondary px-1 py-0.5">
                    .claude/settings.json
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-secondary px-1 py-0.5">
                    .codex/config.toml
                  </code>
                  .
                </p>
              </div>
            </section>
          )}

          {activeSection === "templates" && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Layers className="h-3 w-3" aria-hidden />
                Templates
              </h2>
              <ToggleRow
                label="Enable community templates"
                description="Show community templates alongside official BMO starters."
                checked={communityTemplates}
                onChange={setCommunityTemplates}
              />
            </section>
          )}

          {activeSection === "runtime" && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Gauge className="h-3 w-3" aria-hidden />
                Runtime
              </h2>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <p>Projects run in Docker containers managed by BMO.</p>
                <p className="text-[10px] text-muted-foreground/60">
                  Future versions will allow per-project resource and port limits.
                </p>
              </div>
            </section>
          )}

          {activeSection === "diagnostics" && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <TerminalSquare className="h-3 w-3" aria-hidden />
                Diagnostics
              </h2>
              <ToggleRow
                label="Share anonymous diagnostics"
                description="Helps improve BMO. No code or file paths are ever collected."
                checked={telemetry}
                onChange={setTelemetry}
              />
            </section>
          )}
        </div>
      </div>
    </AppPageShell>
  );
}
