import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const redisDockerDiscovery: DockerEngineDiscovery<"Redis"> = {
  engine: "Redis",
  preferredPrivatePorts: [6379],
  matchImage: (s) => s.includes("redis"),
};

