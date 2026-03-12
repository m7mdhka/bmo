import type { ReactNode } from "react";

import { AppTopbar } from "@/components/layout/topbar";
import { AppFrame } from "@/components/layout/app-frame";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background font-mono text-foreground">
      <AppTopbar />
      <AppFrame>{children}</AppFrame>
    </div>
  );
}
