# Runbook — data refresh

How seed datasets get updated, validated, and re-derived — in strict order or
CI will argue with you.

## The seed package

`packages/seed` owns offline datasets:

- `waves.json` — the 8-wave arrival schedule (Shahi snan anchors: Makar
  Sankranti 0.18, Mauni Amavasya 0.42, Vasant Panchami 0.22; 5 filler waves).
- `sector-archive.json` — the 24-sector reference (names, `nameHi`, kinds,
  areas, service capacities, `handicapMask`).
- `trains.json` — rail timetable (platform, arrivalMin, cohort sizes);
  consumed by `RailScheduler` + the `rail::${seed}` namespace.
- `bazaar-items.json` — the bazaar item curve set for `BazaarSim`.

Everything crosses a zod boundary: shapes live in `packages/seed/src`
(catalog queries) and `@sangamora/core` re-exports what the engine consumes.

## Refresh flow

```powershell
# 1. Edit the JSON (schema-first: match the zod schema, not the other way)
$editor packages/seed/data/trains.json

# 2. Validate + regenerate derived artefacts
bun run generate          # regen expanded datasets + generated/ artefacts

# 3. Verify nothing drifted silently
bun run generate:check    # CI parity of generated outputs

# 4. Full guard
bun run test && bun run typecheck
```

## Commit discipline

One dataset change = one commit. Titles follow the domain rather than the
tool: `feat(seed): add Diwali 2027 special trains` — the diff shows JSON,
generation diffs land in the same commit (reviewers see intent and
consequence together).

## Regenerating

`bun run generate` (idempotent, offline) rebuilds:

- expanded wave jitter tables per supported seed,
- the sector BFS rows used in docs examples (if you changed topology —
  remember `edges.ts`/`sectors.ts` live in `packages/core`, not here),
- bazaar curve caches derived from `bazaar-items.json`.

If `generate:check` fails after a data refresh, a stale artefact wasn't
committed — regen locally and include it.

## Gates

- `bun run test -w packages/seed` — zod schemas + determinism tests.
- Spot-check `/calendar` renders the refreshed schedule, and `/rails` shows
  the first train cohort entering the platform pad.
- Big data refreshes go behind a scenario: change `totalPilgrims`, not the
  baseline curves, so `2019-realistic` stays the invariant reference.
