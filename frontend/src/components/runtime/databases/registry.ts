"use client";

import type { EngineDefinition } from "@/components/runtime/databases/types/engine-definition";
import type {
  AnyDatabaseEngineModule,
  DatabaseEngineModule,
  FamilyId,
} from "@/components/runtime/databases/types";

import type { DbDetails, DbEngine } from "@/components/runtime/databases/types";
import { FAMILIES } from "@/components/runtime/databases/types/families";
import { GROUPS } from "@/components/runtime/databases/types/groups";

import { bigquery } from "@/components/runtime/databases/engines/bigquery/engine";
import { clickhouse } from "@/components/runtime/databases/engines/clickhouse/engine";
import { snowflake } from "@/components/runtime/databases/engines/snowflake/engine";
import { cassandra } from "@/components/runtime/databases/engines/cassandra/engine";
import { couchdb } from "@/components/runtime/databases/engines/couchdb/engine";
import { dynamodb } from "@/components/runtime/databases/engines/dynamodb/engine";
import { firestore } from "@/components/runtime/databases/engines/firestore/engine";
import { mongodb } from "@/components/runtime/databases/engines/mongodb/engine";
import { neo4j } from "@/components/runtime/databases/engines/neo4j/engine";
import { redis } from "@/components/runtime/databases/engines/redis/engine";
import { elasticsearch } from "@/components/runtime/databases/engines/elasticsearch/engine";
import { influxdb } from "@/components/runtime/databases/engines/influxdb/engine";
import { cockroachdb } from "@/components/runtime/databases/engines/cockroachdb/engine";
import { db2 } from "@/components/runtime/databases/engines/db2/engine";
import { mariadb } from "@/components/runtime/databases/engines/mariadb/engine";
import { mysql } from "@/components/runtime/databases/engines/mysql/engine";
import { oracle } from "@/components/runtime/databases/engines/oracle/engine";
import { postgres } from "@/components/runtime/databases/engines/postgres/engine";
import { sqlite } from "@/components/runtime/databases/engines/sqlite/engine";
import { sqlserver } from "@/components/runtime/databases/engines/sqlserver/engine";

const ENGINE_MODULE_LIST: readonly AnyDatabaseEngineModule[] = [
  postgres as AnyDatabaseEngineModule,
  mysql as AnyDatabaseEngineModule,
  mariadb as AnyDatabaseEngineModule,
  cockroachdb as AnyDatabaseEngineModule,
  db2 as AnyDatabaseEngineModule,
  sqlite as AnyDatabaseEngineModule,
  sqlserver as AnyDatabaseEngineModule,
  oracle as AnyDatabaseEngineModule,
  bigquery as AnyDatabaseEngineModule,
  clickhouse as AnyDatabaseEngineModule,
  snowflake as AnyDatabaseEngineModule,
  mongodb as AnyDatabaseEngineModule,
  couchdb as AnyDatabaseEngineModule,
  dynamodb as AnyDatabaseEngineModule,
  firestore as AnyDatabaseEngineModule,
  redis as AnyDatabaseEngineModule,
  cassandra as AnyDatabaseEngineModule,
  neo4j as AnyDatabaseEngineModule,
  elasticsearch as AnyDatabaseEngineModule,
  influxdb as AnyDatabaseEngineModule,
];

export const ENGINE_MODULES = Object.fromEntries(
  ENGINE_MODULE_LIST.map((m) => [m.id, m]),
) as unknown as { [E in DbEngine]: DatabaseEngineModule<E> };

export const ENGINE_REGISTRY = Object.fromEntries(
  ENGINE_MODULE_LIST.map((m) => [m.id, m.definition]),
) as { [E in DbEngine]: EngineDefinition<E> };

export const ENGINE_DEFINITIONS = Object.values(ENGINE_REGISTRY);

export const ENGINE_GROUPS = Object.values(GROUPS);

const FAMILY_ORDER = Object.keys(FAMILIES) as FamilyId[];

export const ENGINE_FAMILY_GROUPS = FAMILY_ORDER.flatMap((id) => {
  const engines = ENGINE_MODULE_LIST.filter((m) => m.family.id === id);
  if (!engines.length) return [];
  return [{ id, label: FAMILIES[id].label, engineIds: engines.map((m) => m.id) }];
});

export function getEngineDefinition<E extends DbEngine>(engine: E): EngineDefinition<E> {
  const found = ENGINE_REGISTRY[engine];
  if (!found) throw new Error(`Missing engine definition registration for "${engine}"`);
  return found as unknown as EngineDefinition<E>;
}

export function getEngineModule<E extends DbEngine>(engine: E): DatabaseEngineModule<E> {
  const found = ENGINE_MODULES[engine];
  if (!found) throw new Error(`Missing engine module registration for "${engine}"`);
  return found as unknown as DatabaseEngineModule<E>;
}

export function getFamilyForEngine<E extends DbEngine>(engine: E): FamilyId {
  return getEngineModule(engine).family.id;
}

export function withEngineDefinition<R>(
  details: DbDetails,
  fn: (def: EngineDefinition<DbEngine>, details: DbDetails) => R,
): R {
  const def = getEngineDefinition(details.engine);
  return fn(def as EngineDefinition<DbEngine>, details);
}
