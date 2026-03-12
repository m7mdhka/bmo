import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const mysqlDockerDiscovery: DockerEngineDiscovery<"MySQL"> = {
  engine: "MySQL",
  preferredPrivatePorts: [3306],
  matchImage: (s) => s.includes("mysql"),
};

