import type { DbEngine } from "../types";

import type { DockerEngineDiscovery } from "./docker-discovery-types";
import { mariadbDockerDiscovery } from "./mariadb.docker-discovery";
import { postgresDockerDiscovery } from "./postgres.docker-discovery";
import { cockroachdbDockerDiscovery } from "./cockroachdb.docker-discovery";
import { mysqlDockerDiscovery } from "./mysql.docker-discovery";
import { redisDockerDiscovery } from "./redis.docker-discovery";
import { mongodbDockerDiscovery } from "./mongodb.docker-discovery";
import { elasticsearchDockerDiscovery } from "./elasticsearch.docker-discovery";
import { cassandraDockerDiscovery } from "./cassandra.docker-discovery";
import { couchdbDockerDiscovery } from "./couchdb.docker-discovery";
import { neo4jDockerDiscovery } from "./neo4j.docker-discovery";
import { influxdbDockerDiscovery } from "./influxdb.docker-discovery";
import { clickhouseDockerDiscovery } from "./clickhouse.docker-discovery";
import { dynamodbDockerDiscovery } from "./dynamodb.docker-discovery";
import { sqlserverDockerDiscovery } from "./sqlserver.docker-discovery";
import { oracleDockerDiscovery } from "./oracle.docker-discovery";
import { db2DockerDiscovery } from "./db2.docker-discovery";
import { firestoreDockerDiscovery } from "./firestore.docker-discovery";

// Order matters for image matching.
// Example: some MariaDB tags may include "mysql" in their image name.
const DISCOVERY_ORDERED: readonly DockerEngineDiscovery[] = [
  mariadbDockerDiscovery,
  postgresDockerDiscovery,
  cockroachdbDockerDiscovery,
  mysqlDockerDiscovery,
  redisDockerDiscovery,
  mongodbDockerDiscovery,
  elasticsearchDockerDiscovery,
  cassandraDockerDiscovery,
  couchdbDockerDiscovery,
  neo4jDockerDiscovery,
  influxdbDockerDiscovery,
  clickhouseDockerDiscovery,
  dynamodbDockerDiscovery,
  sqlserverDockerDiscovery,
  oracleDockerDiscovery,
  db2DockerDiscovery,
  firestoreDockerDiscovery,
] as const;

const BY_ENGINE: Partial<Record<DbEngine, DockerEngineDiscovery>> = Object.fromEntries(
  DISCOVERY_ORDERED.map((d) => [d.engine, d]),
);

export function inferDockerEngineFromImage(image: string): DbEngine | null {
  const s = image.toLowerCase();
  for (const d of DISCOVERY_ORDERED) {
    if (d.matchImage(s)) return d.engine;
  }
  return null;
}

export function getDockerPreferredPrivatePorts(engine: DbEngine): number[] {
  return BY_ENGINE[engine]?.preferredPrivatePorts ?? [];
}

