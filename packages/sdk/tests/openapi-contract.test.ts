/** Contract-loader tests: absent openapi.json → null (skip), present file → validated. */
import { describe, expect, it } from "vitest";
import { AGENTS_OPENAPI_PATH, loadAgentsOpenApi } from "../src/openapi-contract";

describe("loadAgentsOpenApi", () => {
  it("returns null when services/agents/openapi.json is absent at rest", async () => {
    // FastAPI materializes /openapi.json at RUNTIME only; nothing is committed.
    expect(await loadAgentsOpenApi()).toBeNull();
  });

  it("returns null for a custom path that does not exist (no throw, no network)", async () => {
    expect(await loadAgentsOpenApi("some/where/else/openapi.json")).toBeNull();
  });

  it("keeps the default path pointing at the runtime-only artifact", () => {
    expect(AGENTS_OPENAPI_PATH).toBe("../../services/agents/openapi.json");
  });
});
