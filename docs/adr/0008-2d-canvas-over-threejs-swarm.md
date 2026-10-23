# ADR 0008 — The `/map` swarm view: 2D canvas over three.js

Date: 2026-10-23
Status: Accepted

## Context

The main product surface is `/map`: 5M pilgrims as mass, flowing over 54 edges
between 24 sectors, refreshed every tick with overlays (risk bands, marshal
directives, sample particles). Three.js and `@react-three/fiber` were installed
during an early spike for a 3D ghat fly-through; the spike was abandoned after
profiling showed the cost was all in scene-graph overhead, not pixels, and any
GPU path reintroduces the reproducibility tax ADR 0001 exists to avoid.

## Decision

`/map` renders on a **plain 2D `<canvas>`**, painter's model, no shaders:

- Sector discs and edge flows are drawn every animation frame from
  `TickResult` — widths, utilization colour bands and stock density all come
  from CSV-simple math on the same data the charts use.
- `"People"` are rendered by `sampleAgents()` (deterministic per
  `(state, seed)`), drawn as small dots with `step`-driven tint, capped at a
  few thousand particles — a *sampling of the mass*, never an agent sim.
- Overlays (risk pulses, directive arrows, hover tooltips) are ordinary canvas
  draws stacked after the base pass, deterministic in draw order.
- three.js / `@react-three/fiber` / drei stay in the dependency tree from the
  spike, but nothing in production mounts them; their removal is tracked as
  cleanliness work for the next release wave, and **a future ADR is required**
  to introduce a 3D view.

## Consequences

- Frame cost is predictable and O(nodes) — 24 sectors + 54 edges + a particle
  cap leaves headroom on a mid-tier laptop at 60 fps.
- Zero WebGL context-loss handling, zero shader versioning, works headless in
  Playwright e2e screenshots the same way as in the tab.
- The product narrative changes: the "wow" is the deterministic mela itself,
  not a light show; the explainer relishes this instead of apologising.

## Alternatives considered

- **three.js instanced particles** — rejected: scene graph + GPU float
  nondeterminism for a visual gain the 2D pass doesn't need.
- **SVG DOM nodes** — rejected: 80+ animated elements per tick is DOM churn at
  60 fps; canvas is the honest tool.
- **WebGPU / WebGL compute** — rejected: browser support surface, and the
  engine's mass model already gives us the physics without it.
