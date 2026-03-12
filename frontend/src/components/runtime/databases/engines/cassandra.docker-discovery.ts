import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const cassandraDockerDiscovery: DockerEngineDiscovery<"Cassandra"> = {
  engine: "Cassandra",
  preferredPrivatePorts: [9042],
  matchImage: (s) => s.includes("cassandra"),
};

