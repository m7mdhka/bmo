import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const postgresDockerDiscovery: DockerEngineDiscovery<"Postgres"> = {
  engine: "Postgres",
  preferredPrivatePorts: [5432],
  matchImage: (s) => s.includes("postgres"),
};

