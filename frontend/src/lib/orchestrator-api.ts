import "server-only";

export class OrchestratorUnavailableError extends Error {
  constructor(message = "BMO orchestrator is unavailable.") {
    super(message);
    this.name = "OrchestratorUnavailableError";
  }
}

function baseUrl() {
  return process.env.BMO_ORCHESTRATOR_URL?.trim() || "http://localhost:8000";
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  cache?: RequestCache;
};

export async function orchestratorFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: options.method ?? "GET",
      cache: options.cache ?? "no-store",
      headers: options.body ? { "content-type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    throw new OrchestratorUnavailableError(
      error instanceof Error ? `BMO orchestrator is unavailable at ${baseUrl()}.` : "BMO orchestrator is unavailable.",
    );
  }

  const payload = (await response.json()) as T & { detail?: string };
  if (!response.ok) {
    throw new Error((payload as { detail?: string }).detail ?? "Orchestrator request failed.");
  }
  return payload;
}

export function orchestratorBaseUrl() {
  return baseUrl();
}
