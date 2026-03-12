import { NewProjectForm } from "@/components/projects/new-project-form";

export const metadata = {
  title: "New project · BMO",
};

export default function NewProjectPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 font-mono">
      <div className="border-b border-border pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          ~/workspace / new
        </p>
        <h1 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">
          New project
        </h1>
      </div>

      <NewProjectForm />
    </div>
  );
}
