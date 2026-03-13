"use client";

/**
 * Placeholder content shown inside the preview iframe for a project.
 * All devtools and message-bridge logic lives in PreviewBridge (root layout).
 * This component only provides the visual content, constrained to the space
 * above the eruda panel via the --bmo-eruda-height CSS custom property.
 */

export function PreviewClient({ projectId }: { projectId: string }) {
  return (
    <div
      style={{ height: "calc(100vh - var(--bmo-eruda-height, 0px))", overflowY: "auto" }}
    >
      <main className="flex min-h-full items-center justify-center bg-background p-6 font-mono text-foreground">
        <div className="w-full max-w-xl border border-sidebar-border bg-sidebar p-4 text-xs text-sidebar-foreground">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Preview
          </div>
          <p className="text-muted-foreground">
            Preview runtime is not wired yet for <span className="text-foreground">{projectId}</span>.
          </p>
          <p className="mt-2 text-muted-foreground">
            When project runtime wiring lands, this page will show the running app (or a static preview) for
            the current project.
          </p>
        </div>
      </main>
    </div>
  );
}
