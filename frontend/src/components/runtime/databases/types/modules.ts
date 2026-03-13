import type { DbEngine } from "./models";
import type { EngineCapabilities, QueryMeta } from "./studio";
import type { EngineDefinition } from "./engine-definition";

export type { FamilyId, FamilyInfo } from "./families";

import type { FamilyInfo } from "./families";

export type EngineStudioConfig = {
  queryLabel: string;
  starterQuery: string;
  objectNoun: string;
};

export type EngineQueryResult = {
  columns: string[];
  rows: Array<Record<string, string>>;
  meta?: QueryMeta;
  error?: string;
};

export type DockerDiscovery = {
  preferredPrivatePorts: number[];
  matchImage: (imageLower: string) => boolean;
};

export type DatabaseEngineModule<E extends DbEngine = DbEngine> = {
  id: E;
  family: FamilyInfo;
  definition: EngineDefinition<E>;
  capabilities: EngineCapabilities;
  studio: EngineStudioConfig;
  dockerDiscovery?: DockerDiscovery;
  executeQuery: (input: { connectionId: string; queryText: string }) => Promise<EngineQueryResult>;
};

export type AnyDatabaseEngineModule = DatabaseEngineModule<DbEngine>;
