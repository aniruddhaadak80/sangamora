# ADR 0004 — Capacity, friction and BPR constants: why exactly these numbers

Date: 2026-10-23
Status: Accepted

## Context

The engine needs a small set of hard numbers with a defensible story, since the
whole product claims "deterministic with referenceable constants". Every number
in `packages/core` is therefore pinned in code comments with its rationale, and
crates/flow (Rust) replicates the same quantities so parity can be tested, not
assumed.

## Decision

- **46 people/min per meter of width** — classic walkway unit-flow capacity
  (~2,760 p/h/m), the point beyond which flow breaks down; this is the
  free-flow capacity law: `capacity = widthM × 46`.
- **4 people/m² crush density** (~0.25 m²/person) — the standing-room ceiling;
  sector `crushCap = areaM2 / 4`, and `jammed` is population ≥ crushCap.
- **Friction floor 0.08 with smoothstep(0.35, 1.25)** — `slowdownFactor`
  collapses throughput smoothly toward the floor as density passes crush;
  smoothstep because it is cheap, continuous and gradient-free.
- **60 m/min** base walk speed — only feeds `travelTimeMin` display; chosen as
  brisk-but-calm so the number reads sensibly next to widths and lengths.
- **2,600 people/min terminal dispersal** — lockers, buses and phullan wallah
  queues downstream; fixed so the Sangam stays a queue marshals must manage.
- **BPR stress for the Rust parity engine** — `crates/flow` parameterises the
  same travel-time/stress curve with the canonical Bureau of Public Roads
  alpha = 0.15, beta = 4; an 8-row shared fixture (density, width, target flow
  → time) is committed so `cargo test` and `bun test` assert equality, not
  coincidence.
- **Marshal multipliers clamp to [0.05, 2.5]** per edge and compose
  multiplicatively — a picket can choke a road to near-zero or roughly double
  it, but cannot inject mass or leak it, so conservation survives any patch.

## Consequences

- Every constant is quotable in docs, UI tooltips and tests.
- The Rust/TS pair enforces "one physics, two languages" forever; any constant
  change is a fixture change plus a visible diff.
- Modest precision is traded for stamina: no solver runs, so a 10,080-tick week
  is milliseconds.

## Alternatives considered

- **Full social-force ODE** (Helbing-Molnár) — rejected: per-person, not
  conserved-mass scale; see ADR 0001.
- **Calibrated constants from published 2019 counts** — rejected: tempting but
  unverifiable per-sector; working literature values keep the claim honest.
- **Different BPR betas (β=2 or tuned)** — rejected: β=4 is the standard.
