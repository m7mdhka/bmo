import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const sqlserverDockerDiscovery: DockerEngineDiscovery<"SQLServer"> = {
  engine: "SQLServer",
  preferredPrivatePorts: [1433],
  matchImage: (s) => s.includes("mssql") || s.includes("sqlserver") || s.includes("azure-sql-edge"),
};

