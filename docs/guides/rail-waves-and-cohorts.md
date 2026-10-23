# Rail waves and cohorts

Trains are the mela's ingress engine: platforms discharge cohorts, cohorts
walk the rail sidings, and a badly-timed platform release is how a bottleneck
gets born before dawn. `RailScheduler` models this without inventing a second
crowd physics — cohorts are just scheduled mass injection.

## The timetable

`packages/seed/data/trains.json` lists the arrivals (id, platform, arrivalMin,
cohortSize — 16–22 coach capacities; 1,200–2,400 pilgrims being typical) and
`RailScheduler` turns a seed into a deterministic schedule:

- `startHr ± jitter` uses the `rail::${seed}` namespace — a namespace of its
  own so rescheduling trains never shifts the crowd's jitter (see the seed
  guide).
- Cohorts queue on the platform pad until the siding flow opens; the pad is
  the sector they land in, so downstream math is the same edge math used by
  everyone else.

## Cohorts ride the existing engine

A released cohort adds `cohortSize` to one station sector's score through the
normal arrival channels — the tick does not special-case trains. That keeps
mass conservation exact and lets the parikrama BFS handle platform pressure
identical to how it handles roadwalkers.

## Where it goes wrong on purpose

The `rail-jaam` scenario (one of the eight shipped) throttles rail-platform
capacity and starves the `jhunsi-siding`/`rambagh-siding` edges; watch
`travelTimeMin` on those two edges and the amber→red climb on the `/risk`
board. The realistic countermeasure is a marshal directive:

```ts
sim.directive({ edges: { "station-yard": 1.4 }, sectors: { "prayagraj-jn": 1.1 } });
```

## Checklist for timetable changes

1. Edit `trains.json` (zod schema in `packages/seed` will catch bad minute
   ranges or zero cohorts).
2. `bun run test -w packages/seed` — the fixture's determinism test re-derives
   schedule hashes.
3. Open `/rails` and verify the first-arrival cohort lands on the platform,
   not floating in nowhere — a negative `arrivalMin` zod-trap regressed once
   before being hardened.
