"use client";

export function HelpBox({
  title,
  children,
  fullWidth = false,
}: {
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={[
        "border border-border bg-secondary/30 p-3 text-[10px] text-muted-foreground/70",
        fullWidth ? "sm:col-span-2" : "",
      ].join(" ")}
    >
      <p className="font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
