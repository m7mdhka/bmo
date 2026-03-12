"use client";

import type { EngineDefinition } from "./engine-definition";
import type { DbDetails, DbEngine } from "./types";

import { postgresEngine } from "./engines/postgres";
import { mysqlEngine } from "./engines/mysql";
import { mariadbEngine } from "./engines/mariadb";
import { cockroachdbEngine } from "./engines/cockroachdb";
import { db2Engine } from "./engines/db2";
import { sqliteEngine } from "./engines/sqlite";
import { sqlserverEngine } from "./engines/sqlserver";
import { oracleEngine } from "./engines/oracle";
import { mongodbEngine } from "./engines/mongodb";
import { redisEngine } from "./engines/redis";
import { elasticsearchEngine } from "./engines/elasticsearch";
import { cassandraEngine } from "./engines/cassandra";
import { couchdbEngine } from "./engines/couchdb";
import { neo4jEngine } from "./engines/neo4j";
import { influxdbEngine } from "./engines/influxdb";
import { clickhouseEngine } from "./engines/clickhouse";
import { snowflakeEngine } from "./engines/snowflake";
import { bigqueryEngine } from "./engines/bigquery";
import { dynamodbEngine } from "./engines/dynamodb";
import { firestoreEngine } from "./engines/firestore";

export type EngineRegistry = { [E in DbEngine]: EngineDefinition<E> };

export const ENGINE_REGISTRY: EngineRegistry = {
  Postgres: postgresEngine,
  MySQL: mysqlEngine,
  MariaDB: mariadbEngine,
  CockroachDB: cockroachdbEngine,
  Db2: db2Engine,
  SQLite: sqliteEngine,
  SQLServer: sqlserverEngine,
  Oracle: oracleEngine,
  MongoDB: mongodbEngine,
  Redis: redisEngine,
  Elasticsearch: elasticsearchEngine,
  Cassandra: cassandraEngine,
  CouchDB: couchdbEngine,
  Neo4j: neo4jEngine,
  InfluxDB: influxdbEngine,
  ClickHouse: clickhouseEngine,
  Snowflake: snowflakeEngine,
  BigQuery: bigqueryEngine,
  DynamoDB: dynamodbEngine,
  Firestore: firestoreEngine,
};

export const ENGINE_DEFINITIONS = Object.values(ENGINE_REGISTRY);

export const ENGINE_GROUPS = Array.from(
  new Set(ENGINE_DEFINITIONS.map((d) => d.group)),
);

export function getEngineDefinition<E extends DbEngine>(engine: E): EngineDefinition<E> {
  return ENGINE_REGISTRY[engine];
}

export function withEngineDefinition<R>(
  details: DbDetails,
  fn: (def: EngineDefinition<DbEngine>, details: DbDetails) => R,
): R {
  // TS cannot keep the runtime correlation between `details.engine` and `ENGINE_REGISTRY[engine]`
  // across union types. Keep the one cast here; engine implementations remain fully typed.
  const def = ENGINE_REGISTRY[details.engine] as unknown as EngineDefinition<DbEngine>;
  return fn(def, details);
}
