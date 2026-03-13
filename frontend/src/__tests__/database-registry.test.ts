import { describe, expect, it } from "vitest";

import { getEngineModule, getFamilyForEngine } from "@/components/runtime/databases/registry";

describe("database family registry", () => {
  it("maps relational and analytics engines through type folders", () => {
    expect(getFamilyForEngine("Postgres")).toBe("relational");
    expect(getFamilyForEngine("SQLServer")).toBe("relational");
    expect(getFamilyForEngine("BigQuery")).toBe("analytics");
  });

  it("maps specialized non-relational engines through type folders", () => {
    expect(getFamilyForEngine("MongoDB")).toBe("document");
    expect(getFamilyForEngine("Redis")).toBe("keyvalue");
    expect(getFamilyForEngine("Elasticsearch")).toBe("search");
    expect(getFamilyForEngine("Neo4j")).toBe("graph");
  });

  it("exposes capability metadata from engine adapters", () => {
    expect(getEngineModule("Postgres").capabilities.queryLanguage).toBe("sql");
    expect(getEngineModule("MongoDB").capabilities.queryLanguage).toBe("json");
  });
});
