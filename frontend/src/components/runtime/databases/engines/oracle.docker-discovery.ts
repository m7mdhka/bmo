import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const oracleDockerDiscovery: DockerEngineDiscovery<"Oracle"> = {
  engine: "Oracle",
  preferredPrivatePorts: [1521],
  matchImage: (s) => s.includes("oracle"),
};

