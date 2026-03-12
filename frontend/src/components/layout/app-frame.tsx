"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";

function isProjectWorkspacePath(pathname: string) {
  // Hide the global sidebar for per-project workspaces only.
  // Keep it for the Projects list and the "new project" flow.
  if (!pathname.startsWith("/projects/")) return false;
  if (pathname === "/projects") return false;
  if (pathname.startsWith("/projects/new")) return false;
  return true;
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = isProjectWorkspacePath(pathname);

  return (
    <div className="flex flex-1 overflow-hidden">
      {hideSidebar ? null : <AppSidebar />}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className={hideSidebar ? "flex h-full flex-col" : "flex h-full flex-col p-4 sm:p-5"}>
          {children}
        </div>
      </main>
    </div>
  );
}

