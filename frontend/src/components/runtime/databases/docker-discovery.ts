import type { DbEngine, DockerDiscovery } from "@/components/runtime/databases/types";

type DockerEngineDiscovery<E extends DbEngine = DbEngine> = {
  engine: E;
} & DockerDiscovery;

// Order matters for image matching.
// Example: some MariaDB tags may include "mysql" in their image name.
const DISCOVERY_ORDERED: readonly DockerEngineDiscovery[] = [
  {
    engine: "MariaDB",
    preferredPrivatePorts: [3306],
    matchImage: (s) => s.includes("mariadb"),
  },
  {
    engine: "Postgres",
    preferredPrivatePorts: [5432],
    matchImage: (s) => s.includes("postgres"),
  },
  {
    engine: "CockroachDB",
    preferredPrivatePorts: [26257, 5432],
    matchImage: (s) => s.includes("cockroach"),
  },
  {
    engine: "MySQL",
    preferredPrivatePorts: [3306],
    matchImage: (s) => s.includes("mysql"),
  },
  {
    engine: "Redis",
    preferredPrivatePorts: [6379],
    matchImage: (s) => s.includes("redis"),
  },
  {
    engine: "MongoDB",
    preferredPrivatePorts: [27017],
    matchImage: (s) => s.includes("mongo"),
  },
  {
    engine: "Elasticsearch",
    preferredPrivatePorts: [9200],
    matchImage: (s) => s.includes("elasticsearch"),
  },
  {
    engine: "Cassandra",
    preferredPrivatePorts: [9042],
    matchImage: (s) => s.includes("cassandra"),
  },
  {
    engine: "CouchDB",
    preferredPrivatePorts: [5984],
    matchImage: (s) => s.includes("couchdb"),
  },
  {
    engine: "Neo4j",
    preferredPrivatePorts: [7687, 7474],
    matchImage: (s) => s.includes("neo4j"),
  },
  {
    engine: "InfluxDB",
    preferredPrivatePorts: [8086],
    matchImage: (s) => s.includes("influxdb"),
  },
  {
    engine: "ClickHouse",
    preferredPrivatePorts: [8123, 9000],
    matchImage: (s) => s.includes("clickhouse"),
  },
  {
    engine: "DynamoDB",
    preferredPrivatePorts: [8000],
    matchImage: (s) => s.includes("dynamodb"),
  },
  {
    engine: "SQLServer",
    preferredPrivatePorts: [1433],
    matchImage: (s) => s.includes("mssql") || s.includes("sqlserver") || s.includes("azure-sql-edge"),
  },
  {
    engine: "Oracle",
    preferredPrivatePorts: [1521],
    matchImage: (s) => s.includes("oracle"),
  },
  {
    engine: "Db2",
    preferredPrivatePorts: [50000],
    matchImage: (s) => s.includes("ibmcom/db2") || (s.includes("db2") && s.includes("ibm")),
  },
  {
    engine: "Firestore",
    preferredPrivatePorts: [8080, 4000],
    matchImage: (s) => s.includes("firestore"),
  },
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

