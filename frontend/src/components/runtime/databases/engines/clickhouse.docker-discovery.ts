import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const clickhouseDockerDiscovery: DockerEngineDiscovery<"ClickHouse"> = {
  engine: "ClickHouse",
  preferredPrivatePorts: [8123, 9000],
  matchImage: (s) => s.includes("clickhouse"),
};

