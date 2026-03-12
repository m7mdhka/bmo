"use client";

import { useMemo, useState } from "react";
import {
  BrainCircuit,
  Check,
  ExternalLink,
  KeyRound,
  Plus,
  Settings2,
  Shield,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppPageShell } from "@/components/layout/app-page-shell";

type ProviderKind = "OpenAI" | "Anthropic" | "Google" | "Ollama" | "Azure OpenAI";

type Provider = {
  id: string;
  kind: ProviderKind;
  label: string;
  configured: boolean;
  default: boolean;
  baseUrl?: string;
  modelsPreview: string[];
};

const MOCK: Provider[] = [
  {
    id: "openai",
    kind: "OpenAI",
    label: "OpenAI",
    configured: false,
    default: true,
    modelsPreview: ["gpt-4.1", "gpt-4o-mini"],
  },
  {
    id: "anthropic",
    kind: "Anthropic",
    label: "Anthropic",
    configured: false,
    default: false,
    modelsPreview: ["claude-3.5-sonnet", "claude-3.5-haiku"],
  },
  {
    id: "ollama",
    kind: "Ollama",
    label: "Local (Ollama)",
    configured: true,
    default: false,
    baseUrl: "http://localhost:11434",
    modelsPreview: ["qwen2.5-coder", "llama3.2"],
  },
];

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return String(Date.now());
  }
}

export function LlmProvidersPage() {
  const [items, setItems] = useState<Provider[]>(MOCK);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.kind.toLowerCase().includes(q) ||
        p.modelsPreview.some((m) => m.toLowerCase().includes(q)),
    );
  }, [items, query]);

  function setDefault(id: string) {
    setItems((prev) => prev.map((p) => ({ ...p, default: p.id === id })));
  }

  function updateProvider(id: string, patch: Partial<Provider>) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  return (
    <AppPageShell
      eyebrow="ai"
      title="LLM Providers"
      description="Register providers and choose a default model source for agents and tools."
      icon={BrainCircuit}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs" disabled title="Import config (coming soon)">
            <Shield className="h-3 w-3" />
            Import
          </Button>
          <AddProviderButton onAdd={(p) => setItems((prev) => [p, ...prev])} />
        </div>
      }
      footer={
        <p className="text-[10px] text-muted-foreground/40">
          Next step: store provider config in a local file and wire agents to pick models from here.
        </p>
      }
    >
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-sm">Providers</CardTitle>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-1 items-center border border-border bg-background px-2 py-1 text-xs">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search providers or models..."
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-[10px] text-muted-foreground/70">
                Default:
              </span>
              <span className="border border-border bg-background px-2 py-1 text-[10px] text-foreground">
                {(items.find((p) => p.default)?.label ?? "—").toLowerCase()}
              </span>
            </div>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/70">
            Provider keys are not persisted yet. This screen is UI scaffolding that will be wired to local config files.
          </p>
        </CardHeader>

        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onSetDefault={() => setDefault(p.id)}
              onConfigure={(configured) => updateProvider(p.id, { configured })}
              onUpdate={(patch) => updateProvider(p.id, patch)}
            />
          ))}
          {filtered.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 border border-dashed border-border bg-background px-3 py-3 text-xs text-muted-foreground">
              No providers match <span className="text-foreground">{query.trim()}</span>.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AppPageShell>
  );
}

function ProviderCard({
  provider,
  onSetDefault,
  onConfigure,
  onUpdate,
}: {
  provider: Provider;
  onSetDefault: () => void;
  onConfigure: (configured: boolean) => void;
  onUpdate: (patch: Partial<Provider>) => void;
}) {
  return (
    <div className="border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{provider.label}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/70">
            {provider.kind}
            {provider.baseUrl ? ` · ${provider.baseUrl}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {provider.default ? (
            <span className="inline-flex items-center gap-1 border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Star className="h-3 w-3" />
              default
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2 border border-border bg-secondary/30 px-2.5 py-2 text-[11px]">
          <span className="flex items-center gap-2 text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            API key
          </span>
          <span
            className={cn(
              "text-[9px] font-semibold uppercase tracking-[0.16em]",
              provider.configured ? "text-emerald-400/90" : "text-muted-foreground/70",
            )}
          >
            {provider.configured ? "configured" : "missing"}
          </span>
        </div>

        <div className="border border-border bg-secondary/30 px-2.5 py-2 text-[11px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Models (preview)
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {provider.modelsPreview.slice(0, 4).map((m) => (
              <span
                key={m}
                className="border border-border bg-background px-2 py-0.5 text-[10px] text-foreground"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant={provider.default ? "secondary" : "outline"}
          size="xs"
          onClick={onSetDefault}
          disabled={provider.default}
        >
          <Check className="h-3 w-3" />
          {provider.default ? "Default" : "Set default"}
        </Button>
        <ConfigureProviderButton
          provider={provider}
          onSave={(patch) => onUpdate(patch)}
          onConfigured={(configured) => onConfigure(configured)}
        />
        <Button
          variant="outline"
          size="xs"
          asChild
        >
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            title="Provider docs (coming soon)"
          >
            <ExternalLink className="h-3 w-3" />
            Docs
          </a>
        </Button>
      </div>
    </div>
  );
}

function ConfigureProviderButton({
  provider,
  onSave,
  onConfigured,
}: {
  provider: Provider;
  onSave: (patch: Partial<Provider>) => void;
  onConfigured: (configured: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl ?? "");
  const [apiKey, setApiKey] = useState("");

  function reset() {
    setBaseUrl(provider.baseUrl ?? "");
    setApiKey("");
  }

  function save() {
    onSave({ baseUrl: baseUrl.trim().length ? baseUrl.trim() : undefined });
    onConfigured(apiKey.trim().length > 0 || provider.configured);
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="xs">
          <Settings2 className="h-3 w-3" />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure {provider.label}</DialogTitle>
          <DialogDescription>
            This is UI-only for now. Keys won&apos;t be saved to disk yet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Base URL (optional)">
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={provider.kind === "Ollama" ? "http://localhost:11434" : "https://api.example.com"}
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </Field>
          <Field label="API key">
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="************"
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              Entering anything here will mark the provider as configured in the UI.
            </p>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddProviderButton({ onAdd }: { onAdd: (p: Provider) => void }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ProviderKind>("OpenAI");
  const [label, setLabel] = useState("");

  const canSave = label.trim().length > 0;

  function reset() {
    setKind("OpenAI");
    setLabel("");
  }

  function save() {
    if (!canSave) return;
    onAdd({
      id: newId(),
      kind,
      label: label.trim(),
      configured: false,
      default: false,
      modelsPreview: [],
    });
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="xs">
          <Plus className="h-3 w-3" />
          Add provider
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add provider</DialogTitle>
          <DialogDescription>
            Create a provider entry. Full auth + persistence is coming next.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Type">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ProviderKind)}
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="OpenAI">OpenAI</option>
              <option value="Anthropic">Anthropic</option>
              <option value="Google">Google</option>
              <option value="Ollama">Ollama</option>
              <option value="Azure OpenAI">Azure OpenAI</option>
            </select>
          </Field>
          <Field label="Label">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My OpenAI"
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
