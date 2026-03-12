import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const dynamodbDockerDiscovery: DockerEngineDiscovery<"DynamoDB"> = {
  engine: "DynamoDB",
  preferredPrivatePorts: [8000],
  matchImage: (s) => s.includes("dynamodb"),
};

