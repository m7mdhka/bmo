"use client";

import type { EngineDefinition } from "@/components/runtime/databases/types/engine-definition";
import type { GroupLabel } from "@/components/runtime/databases/types/groups";
import { GROUPS } from "@/components/runtime/databases/types/groups";
import type {
  DbConfigByEngine,
  DbEngine,
  DbDetailsOf,
  DockerDbCandidateOf,
  SqlHostConfig,
} from "@/components/runtime/databases/types";

import { DetailRow } from "@/components/runtime/databases/ui/components/detail-row";
import { SqlHostFields } from "@/components/runtime/databases/ui/connections/shared/sql-host";
import { applySqlHostConnectionString } from "@/components/runtime/databases/ui/connections/shared/sql-host-connstr";
import { maskSecret } from "@/components/runtime/databases/ui/connections/shared/secrets";

type SqlHostEngine = {
  [E in DbEngine]: DbConfigByEngine[E] extends SqlHostConfig ? E : never;
}[DbEngine];

export function defineSqlHostEngine<E extends SqlHostEngine>({
  id,
  label,
  group,
  Icon,
  defaults,
  connectionStringPlaceholder,
  docker,
}: {
  id: E;
  label: string;
  group: GroupLabel;
  Icon: EngineDefinition["Icon"];
  defaults: SqlHostConfig;
  connectionStringPlaceholder: string;
  docker?: {
    env?: {
      database?: string[];
      username?: string[];
      password?: string[];
    };
  };
}): EngineDefinition<E> {
  return {
    id,
    label,
    group,
    Icon,
    createDefaultDetails: () => ({ engine: id, config: defaults } as DbDetailsOf<E>),
    docker: docker
      ? {
          apply: (details, candidate: DockerDbCandidateOf<E>) => {
            const env = candidate.env ?? {};
            const pick = (keys?: string[]) => {
              for (const k of keys ?? []) {
                const v = env[k];
                if (typeof v === "string" && v.trim().length) return v;
              }
              return undefined;
            };

            return {
              ...details,
              config: {
                ...details.config,
                host: candidate.host,
                port: candidate.port,
                database: pick(docker.env?.database) ?? details.config.database,
                username: pick(docker.env?.username) ?? details.config.username,
                password: pick(docker.env?.password) ?? details.config.password,
              },
            };
          },
        }
      : undefined,
    connectionString: {
      placeholder: connectionStringPlaceholder,
      apply: (details, raw) => {
        const next = applySqlHostConnectionString(details.config, raw);
        return next ? { ...details, config: next } : null;
      },
    },
    summary: (details) => `${details.config.host}:${details.config.port} · ${details.config.database}`,
    validate: (details) => {
      const c = details.config;
      return !!(c.host.trim() && c.port > 0 && c.database.trim() && c.username.trim());
    },
    Fields: (ctx) => SqlHostFields({ ctx }),
    DetailsRows: (details) => {
      const c = details.config;
      return (
        <>
          <DetailRow label="Host" value={c.host} mono />
          <DetailRow label="Port" value={String(c.port)} mono />
          <DetailRow label="Database" value={c.database} mono />
          <DetailRow label="Username" value={c.username} mono />
          <DetailRow label="Password" value={maskSecret(c.password)} mono />
          <DetailRow label="SSL" value={c.ssl} />
        </>
      );
    },
  };
}
