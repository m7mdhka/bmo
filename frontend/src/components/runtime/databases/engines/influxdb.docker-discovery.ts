import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const influxdbDockerDiscovery: DockerEngineDiscovery<"InfluxDB"> = {
  engine: "InfluxDB",
  preferredPrivatePorts: [8086],
  matchImage: (s) => s.includes("influxdb"),
};

