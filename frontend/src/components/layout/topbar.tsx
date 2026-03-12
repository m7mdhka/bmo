import Link from "next/link";
import { Terminal, Github } from "lucide-react";

export function AppTopbar() {
  return (
    <header className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-sidebar px-3 text-xs">
      <div className="flex items-center gap-4">
        <Link
          href="/projects"
          className="flex items-center gap-1.5 font-mono font-bold tracking-tight text-primary transition-opacity hover:opacity-80"
        >
          <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
          <span>BMO</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        <Link
          href="https://github.com/m7mdhka/bmo"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 transition-colors hover:text-foreground"
          aria-label="GitHub"
        >
          <Github className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}
