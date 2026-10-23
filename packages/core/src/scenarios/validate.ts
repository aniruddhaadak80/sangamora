import { z } from "zod";
import type { MarshalAggression, ScenarioMutation, ScenarioPreset } from "./presets";

/**
 * Zod gate for anything arriving from outside the engine: preset files
 * (scenario JSON), user-authored mutation blobs, devtools input.
 * Strict objects — typos like `totalPligrims` fail loudly instead of no-oping.
 */

const MultiplierSchema = z
  .object({
    capacity: z.number().finite().min(0.05).max(2.5).optional(),
    demand: z.number().finite().min(0.05).max(2.5).optional(),
  })
  .strict();

export const MarshalAggressionSchema: z.ZodType<MarshalAggression> = z.union([z.number().min(0).max(1), z.literal("off")]);

export const ScenarioMutationSchema = z
  .object({
    multiplier: MultiplierSchema.optional(),
    totalPilgrims: z.number().int().min(1).max(25_000_000).optional(),
    arrivalScale: z.number().finite().min(0.1).max(4).optional(),
    waveScale: z.number().finite().min(0.1).max(4).optional(),
    marshalAggression: MarshalAggressionSchema.optional(),
  })
  .strict();

export const ScenarioPresetSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().min(1).max(120),
    description: z.string().min(1).max(600),
    mutation: ScenarioMutationSchema,
  })
  .strict();

/**
 * Validate one preset. Throws a single formatted error listing every zod issue
 * (path + message) so a bad preset file names its own problem.
 */
export function validateScenario(preset: unknown): ScenarioPreset {
  const parsed = ScenarioPresetSchema.safeParse(preset);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`validateScenario(): scenario preset is not valid — ${details}`);
  }
  return {
    id: parsed.data.id,
    name: parsed.data.name,
    description: parsed.data.description,
    mutation: parsed.data.mutation as ScenarioMutation,
  };
}
