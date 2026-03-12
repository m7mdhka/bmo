import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/topbar";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background font-mono text-foreground">
      <AppTopbar />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex flex-1 flex-col overflow-auto">
          <div className="flex h-full flex-col p-4 sm:p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
