import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const couchdbDockerDiscovery: DockerEngineDiscovery<"CouchDB"> = {
  engine: "CouchDB",
  preferredPrivatePorts: [5984],
  matchImage: (s) => s.includes("couchdb"),
};

