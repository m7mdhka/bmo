import type { DbEngine } from "../types";

export type DockerEngineDiscovery<E extends DbEngine = DbEngine> = {
  engine: E;
  preferredPrivatePorts: number[];
  // IMPORTANT: input is already lowercased by the caller.
  matchImage: (imageLower: string) => boolean;
};

