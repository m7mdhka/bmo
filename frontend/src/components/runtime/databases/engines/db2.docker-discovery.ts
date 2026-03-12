import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const db2DockerDiscovery: DockerEngineDiscovery<"Db2"> = {
  engine: "Db2",
  preferredPrivatePorts: [50000],
  matchImage: (s) => s.includes("ibmcom/db2") || (s.includes("db2") && s.includes("ibm")),
};

