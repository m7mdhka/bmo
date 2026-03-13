"use client";

import type { ReactNode, ComponentType } from "react";

import type { DbDetailsOf, DbEngine, DockerDbCandidateOf } from "./models";
import type { GroupLabel } from "./groups";

export type DbIconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export type EngineContext<E extends DbEngine> = {
  details: DbDetailsOf<E>;
  onChange: (next: DbDetailsOf<E>) => void;
};

export type EngineDefinition<E extends DbEngine = DbEngine> = {
  id: E;
  label: string;
  group: GroupLabel;
  Icon: DbIconComponent;
  createDefaultDetails: () => DbDetailsOf<E>;
  docker?: {
    apply: (details: DbDetailsOf<E>, candidate: DockerDbCandidateOf<E>) => DbDetailsOf<E>;
  };
  connectionString?: {
    placeholder: string;
    apply: (details: DbDetailsOf<E>, raw: string) => DbDetailsOf<E> | null;
  };
  summary: (details: DbDetailsOf<E>) => string;
  validate: (details: DbDetailsOf<E>) => boolean;
  Fields: (ctx: EngineContext<E>) => ReactNode;
  DetailsRows: (details: DbDetailsOf<E>) => ReactNode;
};
