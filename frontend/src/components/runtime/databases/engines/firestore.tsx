"use client";

import { SiFirebase } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import type { FirestoreConfig } from "../types";
import { Field } from "../form/field";
import { DetailRow } from "../detail-row";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { parseUrl } from "../shared/connection-string";
import { maskSecret } from "../shared/secrets";
import { iconFromReactIcons } from "../shared/react-icons";

export const firestoreEngine: EngineDefinition<"Firestore"> = {
  id: "Firestore",
  label: "Firestore",
  group: "NoSQL",
  Icon: iconFromReactIcons(SiFirebase),
  createDefaultDetails: () => ({
    engine: "Firestore",
    config: {
      projectId: "",
      authMode: "applicationDefault",
      serviceAccountJson: "",
    },
  }),
  docker: {
    apply: (details, candidate) => {
      const env = candidate.env ?? {};
      const projectId = env.GCLOUD_PROJECT ?? env.FIREBASE_PROJECT ?? details.config.projectId;
      return {
        ...details,
        config: {
          ...details.config,
          projectId,
        },
      };
    },
  },
  connectionString: {
    placeholder: "firestore://PROJECT_ID?auth=applicationDefault",
    apply: (details, raw) => {
      const u = parseUrl(raw);
      if (!u) return null;
      const auth = u.searchParams.get("auth");
      const authMode =
        auth === "serviceAccountJson" || auth === "service_account" ? "serviceAccountJson" : "applicationDefault";
      return { ...details, config: { ...details.config, projectId: u.hostname || details.config.projectId, authMode } };
    },
  },
  summary: (details) => details.config.projectId || "not configured",
  validate: (details) => {
    const c = details.config;
    if (!c.projectId.trim()) return false;
    if (c.authMode === "serviceAccountJson" && !c.serviceAccountJson?.trim()) return false;
    return true;
  },
  Fields: ({ details, onChange }) => {
    const c = details.config;
    const useServiceJson = c.authMode === "serviceAccountJson";
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Project ID">
            <input
              value={c.projectId}
              onChange={(e) => onChange({ ...details, config: { ...c, projectId: e.target.value } })}
              placeholder="my-firebase-project"
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </Field>
          <Field label="Authentication">
            <div className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
              <span className="text-muted-foreground">Service account JSON</span>
              <ToggleSwitch
                checked={useServiceJson}
                onCheckedChange={(next) =>
                  onChange({
                    ...details,
                    config: { ...c, authMode: next ? "serviceAccountJson" : "applicationDefault" },
                  })
                }
              />
            </div>
          </Field>
        </div>

        {useServiceJson ? (
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
    const c: FirestoreConfig = details.config;
    return (
      <>
        <DetailRow label="Project ID" value={c.projectId} mono />
        <DetailRow label="Auth" value={c.authMode === "applicationDefault" ? "ADC" : "service account"} />
        <DetailRow
          label="Service JSON"
          value={c.authMode === "applicationDefault" ? "—" : maskSecret(c.serviceAccountJson)}
          mono
        />
      </>
    );
  },
};
