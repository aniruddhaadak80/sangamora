/**
 * Local (pure-TS) solver over canonical edge-flow rows — the always-available
 * fallback behind ./wasm.ts. Every row is zod-validated on entry so malformed
 * input from any runtime (playground feeds, service mirrors) fails loudly and
 * deterministically instead of producing quietly-wrong numbers.
 */
import { z } from "zod";
import { stress, travelTimeMin } from "./engine";

/**
 * Canonical edge row (the `__fixtures__/flow.json` mirror format):
 *   v            — flow (people/min)
 *   c            — capacity (people/min)
 *   freeTimeMin  — minutes to cross at calm
 *
 * Bound note (mirrored by pydantic in services/agents and by the SDK): the
 * ranges keep the closed form inside f64 AND inside valid JSON —
 * worst case v=1e12 with c=1e-6 gives s=1e18 → s⁴=1e72 → tt ≤ 1.15e72, far
 * below 1.8e308, so no Infinity ever reaches `JSON.stringify`.
 */
export const FlowFixtureRowSchema = z.strictObject({
  edgeId: z.string().min(1),
  v: z.number().min(0).max(1e12),
  c: z.number().min(1e-6).max(1e12),
  freeTimeMin: z.number().min(0).max(1e9),
});

export type FlowFixtureRow = z.infer<typeof FlowFixtureRowSchema>;
/** Loose input shape — zod re-checks every row before any math runs. */
export type FlowFixtureInput = z.input<typeof FlowFixtureRowSchema>;

/** Result of the BPR actuator for one edge (= EdgeState's travel fields). */
export const FlowResultSchema = z.strictObject({
  edgeId: z.string(),
  travelTimeMin: z.number(),
  stress: z.number(),
});

export type FlowResult = z.infer<typeof FlowResultSchema>;

/**
 * Row validator shared by the Local and wasm paths so both engines enforce
 * the identical contract (that symmetry is part of the parity contract in
 * ./README.md — a wasm build that produced differently-shaped output would
 * be rejected here, never trusted).
 */
export function parseFlowRows(rows: readonly FlowFixtureInput[]): readonly FlowFixtureRow[] {
  return rows.map((row, index) => {
    const parsed = FlowFixtureRowSchema.safeParse(row);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const detail = issue ? `${issue.path.join(".")}: ${issue.message}` : "invalid row";
      throw new Error(`solveEdges(): row ${index} rejected — ${detail}`);
    }
    return parsed.data;
  });
}

/**
 * Pure-TS kernel: solve every row with the BPR actuator. Synchronous,
 * deterministic, dependency-free — the reference every other engine must
 * reproduce to the last bit.
 */
export function solveEdgesLocal(rows: readonly FlowFixtureInput[]): readonly FlowResult[] {
  const parsed = parseFlowRows(rows);
  return parsed.map((row) => ({
    edgeId: row.edgeId,
    stress: stress(row.v, row.c),
    travelTimeMin: travelTimeMin(row.v, row.c, row.freeTimeMin),
  }));
}
