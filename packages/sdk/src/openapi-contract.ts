/**
 * Optional helper: validates `services/agents/openapi.json` if a copy is
 * present on disk. FastAPI only materializes that document at RUNTIME and the
 * repo commits nothing generated — so at rest this returns null and the
 * contract check simply skips. If a deploy stage DOES snapshot the document,
 * this loader parses the essential shape (openapi version, info, paths).
 *
 * The node import is dynamic + fully caught: bundling this SDK into the
 * browser playground stays safe (fs is absent there → null, no throw).
 */
import { z } from "zod";

export const AgentsOpenApiSchema = z.strictObject({
  openapi: z.string().min(1),
  info: z.strictObject({ title: z.string(), version: z.string() }),
  paths: z.record(z.string(), z.unknown()),
});

export type AgentsOpenApi = z.infer<typeof AgentsOpenApiSchema>;

/** Relative to the packages/sdk cwd (where `bun run test` executes). */
export const AGENTS_OPENAPI_PATH = "../../services/agents/openapi.json";

export async function loadAgentsOpenApi(path: string = AGENTS_OPENAPI_PATH): Promise<AgentsOpenApi | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(path, "utf8");
    return AgentsOpenApiSchema.parse(JSON.parse(raw) as unknown);
  } catch {
    return null; // absent at rest (or unparsable) → contract check skips
  }
}
