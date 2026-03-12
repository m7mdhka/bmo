"use client";

import { SiSqlite } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import type { SqliteConfig } from "../types";
import { Field } from "../form/field";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { DetailRow } from "../detail-row";
import { iconFromReactIcons } from "../shared/react-icons";

export const sqliteEngine: EngineDefinition<"SQLite"> = {
  id: "SQLite",
  label: "SQLite",
  group: "SQL",
  Icon: iconFromReactIcons(SiSqlite),
  createDefaultDetails: () => ({
    engine: "SQLite",
    config: { filePath: "./data/app.sqlite", readOnly: false },
  }),
  summary: (details) => `${details.config.filePath}${details.config.readOnly ? " · ro" : ""}`,
  validate: (details) => details.config.filePath.trim().length > 0,
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="space-y-3">
        <Field label="Database file path">
          <input
            value={c.filePath}
            onChange={(e) => onChange({ ...details, config: { ...c, filePath: e.target.value } })}
            placeholder="./data/app.sqlite"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Mode">
          <div className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
            <span className="text-muted-foreground">Read-only</span>
            <ToggleSwitch
              checked={c.readOnly}
              onCheckedChange={(next) => onChange({ ...details, config: { ...c, readOnly: next } })}
            />
          </div>
        </Field>
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: SqliteConfig = details.config;
    return (
      <>
        <DetailRow label="File path" value={c.filePath} mono />
        <DetailRow label="Mode" value={c.readOnly ? "read-only" : "read-write"} />
      </>
    );
  },
};
