"use client";

import { SiGooglebigquery } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import type { BigQueryConfig } from "../types";
import { Field } from "../form/field";
import { DetailRow } from "../detail-row";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { parseUrl } from "../shared/connection-string";
import { maskSecret } from "../shared/secrets";
import { iconFromReactIcons } from "../shared/react-icons";

export const bigqueryEngine: EngineDefinition<"BigQuery"> = {
  id: "BigQuery",
  label: "BigQuery",
  group: "Analytics",
  Icon: iconFromReactIcons(SiGooglebigquery),
  createDefaultDetails: () => ({
    engine: "BigQuery",
    config: {
      projectId: "",
      dataset: "",
      location: "",
      useADC: true,
      serviceAccountJson: "",
    },
  }),
  connectionString: {
    placeholder: "bigquery://PROJECT_ID?dataset=DATASET&location=LOCATION&useADC=true",
    apply: (details, raw) => {
      const u = parseUrl(raw);
      if (!u) return null;
      const useADCParam = u.searchParams.get("useADC");
      const useADC = useADCParam ? useADCParam === "true" || useADCParam === "1" : details.config.useADC;
      return {
        ...details,
        config: {
          ...details.config,
          projectId: u.hostname || details.config.projectId,
          dataset: u.searchParams.get("dataset") ?? details.config.dataset,
          location: u.searchParams.get("location") ?? details.config.location,
          useADC,
        },
      };
    },
  },
  summary: (details) => {
    const c = details.config;
    return [c.projectId, c.dataset].filter(Boolean).join(" · ") || "not configured";
  },
  validate: (details) => {
    const c = details.config;
    if (!c.projectId.trim()) return false;
    if (!c.useADC && !c.serviceAccountJson?.trim()) return false;
    return true;
  },
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Project ID">
            <input
              value={c.projectId}
              onChange={(e) => onChange({ ...details, config: { ...c, projectId: e.target.value } })}
              placeholder="my-gcp-project"
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </Field>
          <Field label="Dataset (optional)">
            <input
              value={c.dataset ?? ""}
              onChange={(e) => onChange({ ...details, config: { ...c, dataset: e.target.value || undefined } })}
              placeholder="(optional)"
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </Field>
          <Field label="Location (optional)">
            <input
              value={c.location ?? ""}
              onChange={(e) => onChange({ ...details, config: { ...c, location: e.target.value || undefined } })}
              placeholder="US"
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </Field>
          <Field label="Authentication">
            <div className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
              <span className="text-muted-foreground">Use ADC</span>
              <ToggleSwitch
                checked={c.useADC}
                onCheckedChange={(next) => onChange({ ...details, config: { ...c, useADC: next } })}
              />
            </div>
          </Field>
        </div>

        {!c.useADC ? (
          <Field label="Service account JSON" className="w-full">
            <textarea
              value={c.serviceAccountJson ?? ""}
              onChange={(e) =>
                onChange({ ...details, config: { ...c, serviceAccountJson: e.target.value || undefined } })
              }
              rows={7}
              placeholder='{"type":"service_account", ...}'
              className="w-full resize-y border border-border bg-background px-3 py-2 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </Field>
        ) : null}
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: BigQueryConfig = details.config;
    return (
      <>
        <DetailRow label="Project ID" value={c.projectId} mono />
        <DetailRow label="Dataset" value={c.dataset?.trim().length ? c.dataset : "—"} mono />
        <DetailRow label="Location" value={c.location?.trim().length ? c.location : "—"} mono />
        <DetailRow label="Auth" value={c.useADC ? "ADC" : "service account"} />
        <DetailRow label="Service JSON" value={c.useADC ? "—" : maskSecret(c.serviceAccountJson)} mono />
      </>
    );
  },
};

