import type { QueryErrorEnvelope, QueryMeta, QueryPagination } from "./studio";

export type SqlQueryRequest = {
  query: string;
  params?: string[];
  page?: QueryPagination;
};

export type SqlQueryResult = {
  columns: string[];
  rows: Array<Record<string, string | number | boolean | null>>;
  meta: QueryMeta;
  error?: QueryErrorEnvelope;
};

export type SqlExecutorRequest = {
  connectionId: string;
  payload: SqlQueryRequest;
};

export type JsonOperation = string;

export type JsonQueryRequest = {
  operation: JsonOperation;
  payload: Record<string, unknown>;
  page?: QueryPagination;
};

export type JsonQueryResult = {
  documents: Array<Record<string, unknown>>;
  meta: QueryMeta;
  error?: QueryErrorEnvelope;
};

export type JsonExecutorRequest = {
  connectionId: string;
  payload: JsonQueryRequest;
};
