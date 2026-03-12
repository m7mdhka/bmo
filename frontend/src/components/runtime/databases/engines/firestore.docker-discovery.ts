import type { DockerEngineDiscovery } from "./docker-discovery-types";

export const firestoreDockerDiscovery: DockerEngineDiscovery<"Firestore"> = {
  engine: "Firestore",
  preferredPrivatePorts: [8080, 4000],
  matchImage: (s) => s.includes("firestore"),
};

