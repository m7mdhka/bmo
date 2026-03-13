export type SqlSslMode = "disable" | "require";

export type SqlHostConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: SqlSslMode;
};

import type { SqlServerConfig } from "../engines/sqlserver/config";
export type { SqlServerConfig };

import type { OracleConfig } from "../engines/oracle/config";
export type { OracleConfig };

import type { MongoConfig } from "../engines/mongodb/config";
export type { MongoConfig };

import type { RedisConfig } from "../engines/redis/config";
export type { RedisConfig };

import type { SqliteConfig } from "../engines/sqlite/config";
export type { SqliteConfig };

import type { CassandraConfig } from "../engines/cassandra/config";
export type { CassandraConfig };

import type { SearchConfig } from "../engines/elasticsearch/config";
export type { SearchConfig };

import type { CouchDbConfig } from "../engines/couchdb/config";
export type { CouchDbConfig };

import type { Neo4jConfig } from "../engines/neo4j/config";
export type { Neo4jConfig };

import type { InfluxConfig } from "../engines/influxdb/config";
export type { InfluxConfig };

import type { ClickHouseConfig } from "../engines/clickhouse/config";
export type { ClickHouseConfig };

import type { SnowflakeConfig } from "../engines/snowflake/config";
export type { SnowflakeConfig };

import type { BigQueryConfig } from "../engines/bigquery/config";
export type { BigQueryConfig };

import type { DynamoConfig } from "../engines/dynamodb/config";
export type { DynamoConfig };

import type { FirestoreConfig } from "../engines/firestore/config";
export type { FirestoreConfig };

export type DbConfigByEngine = {
  Postgres: SqlHostConfig;
  MySQL: SqlHostConfig;
  MariaDB: SqlHostConfig;
  CockroachDB: SqlHostConfig;
  Db2: SqlHostConfig;
  SQLite: SqliteConfig;
  SQLServer: SqlServerConfig;
  Oracle: OracleConfig;
  MongoDB: MongoConfig;
  Redis: RedisConfig;
  Elasticsearch: SearchConfig;
  Cassandra: CassandraConfig;
  CouchDB: CouchDbConfig;
  Neo4j: Neo4jConfig;
  InfluxDB: InfluxConfig;
  ClickHouse: ClickHouseConfig;
  Snowflake: SnowflakeConfig;
  BigQuery: BigQueryConfig;
  DynamoDB: DynamoConfig;
  Firestore: FirestoreConfig;
};
