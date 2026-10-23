/**
 * Wire contract mirror of `services/agents/app/schemas.py` (pydantic v2).
 *
 * RULES OF THIS FILE: field names and validation bounds must stay EXACTLY in
 * lockstep with the Python models — any bound you change here changes the
 * same line there (see the bound table in services/agents/README.md). Zod v4
 * `z.number()` rejects NaN and Infinity by default, which mirrors pydantic's
 * `allow_inf_nan=False` precisely.
 *
 * Bound table (pydantic ⇄ zod):
 *   EdgeRow.edgeId      min_length=1, max_length=64        ⇄ min(1).max(64)
 *   EdgeRow.v           ge=0, le=1e12                      ⇄ min(0).max(1e12)
 *   EdgeRow.c           ge=1e-6, le=1e12                   ⇄ min(1e-6).max(1e12)
 *   EdgeRow.freeTimeMin ge=0, le=1e9                       ⇄ min(0).max(1e9)
 *   DirectiveRequest.seed ge=0, le=2**53-1                 ⇄ int().min(0).max(2**53-1)
 *   DirectiveRequest.tick ge=0, le=10_000_000              ⇄ int().min(0).max(10_000_000)
 * Request models are strict both sides (extra="forbid" ⇄ z.strictObject) so a
 * typo'd field fails loudly instead of silently dropping BPR inputs.
 */
import { z } from "zod";

/** One edge-flow observation — same row shape as `__fixtures__/flow.json`. */
export const EdgeRowSchema = z.strictObject({
  edgeId: z.string().min(1).max(64),
  v: z.number().min(0).max(1e12),
  c: z.number().min(1e-6).max(1e12),
  freeTimeMin: z.number().min(0).max(1e9),
});

export type EdgeRow = z.infer<typeof EdgeRowSchema>;

export const RiskRequestSchema = z.strictObject({
  edges: z.array(EdgeRowSchema),
});

export type RiskRequest = z.infer<typeof RiskRequestSchema>;

export const RiskResultSchema = z.strictObject({
  edgeId: z.string(),
  travelTimeMin: z.number(),
  stress: z.number(),
});

export type RiskResult = z.infer<typeof RiskResultSchema>;

export const RiskResponseSchema = z.strictObject({
  results: z.array(RiskResultSchema),
  engine: z.string(),
});

export type RiskResponse = z.infer<typeof RiskResponseSchema>;

export const DirectiveRequestSchema = z.strictObject({
  seed: z.number().int().min(0).max(2 ** 53 - 1),
  tick: z.number().int().min(0).max(10_000_000),
  edges: z.array(EdgeRowSchema),
});

export type DirectiveRequest = z.infer<typeof DirectiveRequestSchema>;

export const DirectiveItemSchema = z.strictObject({
  edgeId: z.string(),
  multiplier: z.number(),
  rationale: z.string(),
});

export type DirectiveItem = z.infer<typeof DirectiveItemSchema>;

export const DirectiveResponseSchema = z.strictObject({
  seed: z.number().int(),
  tick: z.number().int(),
  strategy: z.string(),
  directives: z.array(DirectiveItemSchema),
  engine: z.string(),
});

export type DirectiveResponse = z.infer<typeof DirectiveResponseSchema>;

export const HealthResponseSchema = z.strictObject({
  ok: z.literal(true),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
