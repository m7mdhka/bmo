import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const mongodbDockerDiscovery: DockerEngineDiscovery<"MongoDB"> = {
  engine: "MongoDB",
  preferredPrivatePorts: [27017],
  matchImage: (s) => s.includes("mongo"),
};

