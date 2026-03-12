import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const cockroachdbDockerDiscovery: DockerEngineDiscovery<"CockroachDB"> = {
  engine: "CockroachDB",
  preferredPrivatePorts: [26257, 5432],
  matchImage: (s) => s.includes("cockroach"),
};

