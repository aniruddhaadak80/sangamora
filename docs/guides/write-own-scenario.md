# Write your own scenario

A scenario is a plain JSON literal, zod-validated, zero code. The eight
shipped ones live in the sim-store's `SCENARIOS` array; here is the schema and
how to write the ninth.

## The schema

```ts
const ScenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(3),
  description: z.string().max(240),
  totalPilgrims: z.number().int().min(100_000).max(11_000_000),
  marshalAggression: z.number().min(0).max(1),
  waveOverrides: z.array(
    z.object({
      label: z.string(),
      weight: z.number().min(0).max(1),
    })
  ).optional(),
  edgeClosures: z.array(z.string()).optional(),    // edge ids (verify they exist!)
  edgeMultipliers: z.record(z.string(), z.number().min(0.05).max(2.5)).optional(),
  sectorMultipliers: z.record(z.string(), z.number().min(0.05).max(2.5)).optional(),
  inspectAt: z.number().int().min(1),              // minute the diff report pins
});
```

`seed` and `tick` are deliberately **not** scenario fields — they belong to the
run, the scenario belongs to the world.

## The eight shipped

`2019-realistic` (baseline, 5.2M), `no-marshal`, `vip-surges`, `monsoon-surge`,
`rail-jaam`, `pontoon-shutdown`, `overcapacity` (7.8M), `dayan-impossible`
(11M stress test). Each carries a `inspectAt` pinned to its most interesting
minute — e.g. Mauni Amavasya's morning ramp for `monsoon-surge`.

## Writing `queue-curfew`

```powershell
# apps/web/src/lib/scenarios.ts (the SCENARIOS array)
```

```ts
{
  id: "queue-curfew",
  label: "Queue curfew after midnight",
  description: "All ghat approaches halve capacity between 00:00-03:00.",
  totalPilgrims: 5_200_000,
  marshalAggression: 0.4,
  edgeMultipliers: { "sangam-steps-marg": 0.5, "bath-saraswati": 0.5 },
  inspectAt: 480,
}
```

Then:

```powershell
bun run test apps/web   # SCENARIOS schema test covers the array as a whole
bun run dev             # /scenarios shows the card; /map applies it via the palette
```

## Review bars

- `edgeMultipliers`/`sectorMultipliers` keys must exist in `EDGES`/`SECTORS`
  (a typo throws — never a silent no-op).
- `inspectAt` moments the report names must exist in a run (not past hour 168).
- Prefer changing weights, not the arrival channels — the channel split is
  engine-owned (ADR 0004 constants).

Conventional commit: `feat(scenarios): add queue-curfew ghat throttle`.
