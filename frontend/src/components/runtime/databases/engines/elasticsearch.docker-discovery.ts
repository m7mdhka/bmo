import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const elasticsearchDockerDiscovery: DockerEngineDiscovery<"Elasticsearch"> = {
  engine: "Elasticsearch",
  preferredPrivatePorts: [9200],
  matchImage: (s) => s.includes("elasticsearch"),
};

