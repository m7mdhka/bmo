import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const neo4jDockerDiscovery: DockerEngineDiscovery<"Neo4j"> = {
  engine: "Neo4j",
  preferredPrivatePorts: [7687, 7474],
  matchImage: (s) => s.includes("neo4j"),
};

