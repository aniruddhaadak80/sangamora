# ADR 0001 — Deterministic edge-flow over agent-based crowd simulation

Date: 2026-10-23
Status: Accepted

## Context

The brief is a Kumbh-scale sandbox: up to 5M simultaneous pilgrims over a 7-day, minute-granular lifecycle, running in a browser tab, with zero API keys and instant reproducibility. Agent-based crowd models (per-person social force ODEs) are the textbook answer for crowds — and they fail here three ways: 5M agents is orders of magnitude beyond any browser's frame budget; GPU particle paths are not bit-reproducible across machines; and a 10,080-tick week of ODE integrations would spend all CPU on arithmetic no viewer asked for.

## Decision

Model crowds as conserved mass on a graph, in `packages/core`:

- 24 `SECTORS` hold populations in a `Float64Array`; 54 `EDGES` carry flow.
- Each tick every edge pushes `min(capacity, demand) × friction`, where capacity is
  `widthM × 46 people/min` and friction is a **closed form** of the source sector's
  density ratio (`slowdownFactor`, a smoothstep) — not a solved ODE, just a function.
- Flows are computed from a frozen snapshot and applied once, so mass conservation
  is exact: `sum(sector populations) + exited === injected`, provable at any tick.
- All jitter (arrival budgets, wave timing) comes from an `Rng` seeded by
  FNV-1a of a namespaced string (`crowd::${seed}`) — same seed, same universe,
  byte-identical on a laptop or a CI runner.

The renderer never simulates people: `sampleAgents()` draws deterministic
representative particles from population shares for the `/map` canvas.

## Consequences

- Mass conservation is an invariant tests assert, not an aspiration.
- Individual micro-behaviours (counter-flow waves, officer dialogue) are outside
  the model; lending drama through edge chokepoints (4 pontoon bridges, 8–9 m
  wide) and narrow bath steps is the intended effect instead.
- A full 7-day run is cheap enough to replay inside a request — enabling the
  stateHash-fingerprinted time machine and scenario diffs for free.
- GPU/webworker upgrades stay possible because the tick is array math.

## Alternatives considered

- **Full agent sim on GPU** — rejected: non-deterministic float reductions, no
  agent budget fits 5M, debugging opaque.
- **Hybrid agents-at-ghats + edges-elsewhere** — rejected: two state formats,
  snapshot/restore doubles, still not byte-stable.
- **Cellular automata grid** — rejected: discretisation loses exact conservation;
  100k m² sector areas at 1 m² cells is memory-prohibitive.
