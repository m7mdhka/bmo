import type { DbConn, DbEngine } from "./models";

export type CoreEngineId = DbEngine;
export type CoreConnection = DbConn;

export type EngineCapabilities = {
  queryLanguage: "sql" | "json";
  supportsSchemaExplorer: boolean;
  supportsQueryParams: boolean;
  supportsTransactions: boolean;
  supportsStreamingResults: boolean;
};

export type QueryPagination = {
  limit?: number;
  offset?: number;
};

export type QueryErrorEnvelope = {
  code: string;
  message: string;
  details?: string;
};

export type QueryMeta = {
  tookMs: number;
  rowCount?: number;
  source?: string;
};
