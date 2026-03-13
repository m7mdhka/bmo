import type { DbConfigByEngine } from "./engine-configs";

export type ConnStatus = "connected" | "disconnected" | "error";

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
