import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const mariadbDockerDiscovery: DockerEngineDiscovery<"MariaDB"> = {
  engine: "MariaDB",
  preferredPrivatePorts: [3306],
  matchImage: (s) => s.includes("mariadb"),
};

