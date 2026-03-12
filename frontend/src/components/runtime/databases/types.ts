export type ConnStatus = "connected" | "disconnected" | "error";

export type SqlSslMode = "disable" | "require";

export type SqlHostConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: SqlSslMode;
};

export type SqlServerConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
};

export type OracleConfig = {
  host: string;
  port: number;
  serviceName: string;
  username: string;
  password: string;
};

export type MongoConfig = { uri: string };

export type RedisConfig = {
  host: string;
  port: number;
  db?: number;
  username?: string;
  password?: string;
  tls: boolean;
};

export type SqliteConfig = { filePath: string; readOnly: boolean };

export type CassandraConfig = {
  hosts: string;
  port: number;
  keyspace: string;
  username?: string;
  password?: string;
  ssl: boolean;
};

export type SearchConfig = {
  url: string;
  authMode: "none" | "basic" | "apiKey";
  username?: string;
  password?: string;
  apiKey?: string;
};

export type CouchDbConfig = { url: string; username?: string; password?: string };

export type Neo4jConfig = { uri: string; username: string; password: string; database?: string };

export type InfluxConfig = { url: string; org: string; bucket: string; token: string };

export type ClickHouseConfig = {
  host: string;
  port: number;
  database: string;
  secure: boolean;
  username?: string;
  password?: string;
};

export type SnowflakeConfig = {
  account: string;
  warehouse: string;
  database: string;
  schema: string;
  username: string;
  password: string;
  role?: string;
};

export type BigQueryConfig = {
  projectId: string;
  dataset?: string;
  location?: string;
  useADC: boolean;
  serviceAccountJson?: string;
};

export type DynamoConfig = {
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
};

export type FirestoreConfig = {
  projectId: string;
  authMode: "applicationDefault" | "serviceAccountJson";
  serviceAccountJson?: string;
};

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

export type DbEngine = keyof DbConfigByEngine;

export type DbDetails = {
  [E in DbEngine]: { engine: E; config: DbConfigByEngine[E] };
}[DbEngine];

export type DbDetailsOf<E extends DbEngine> = E extends DbEngine
  ? { engine: E; config: DbConfigByEngine[E] }
  : never;

export type DbConn = {
  id: string;
  name: string;
  details: DbDetails;
  status: ConnStatus;
  lastChecked: string;
};

export type DockerPublishedPort = {
  ip?: string;
  privatePort: number;
  publicPort: number;
  type: "tcp" | "udp" | string;
};

export type DockerDbCandidate = {
  containerId: string;
  containerName: string;
  image: string;
  engine: DbEngine;
  host: string;
  port: number;
  privatePort: number;
  ports: DockerPublishedPort[];
  env: Record<string, string>;
};

export type DockerDbCandidateOf<E extends DbEngine> = DockerDbCandidate & { engine: E };
