export type DbEngine = "Postgres" | "MySQL" | "MongoDB" | "Redis" | "SQLite";
export type ConnStatus = "connected" | "disconnected" | "error";

export type PostgresConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: "disable" | "require";
};

export type MysqlConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: "disable" | "require";
};

export type MongoConfig = {
  uri: string;
};

export type RedisConfig = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls: boolean;
};

export type SqliteConfig = {
  filePath: string;
  readOnly: boolean;
};

export type DbConfig =
  | { engine: "Postgres"; config: PostgresConfig }
  | { engine: "MySQL"; config: MysqlConfig }
  | { engine: "MongoDB"; config: MongoConfig }
  | { engine: "Redis"; config: RedisConfig }
  | { engine: "SQLite"; config: SqliteConfig };

export type DbConn = {
  id: string;
  name: string;
  engine: DbEngine;
  details: DbConfig;
  status: ConnStatus;
  lastChecked: string;
};

