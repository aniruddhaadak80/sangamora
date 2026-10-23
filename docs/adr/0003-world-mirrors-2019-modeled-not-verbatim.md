# ADR 0003 — The 24-sector world mirrors the 2019 Prayagraj grid, but is modelled, not verbatim

Date: 2026-10-23
Status: Accepted

## Context

Sangamora needs a believable Kumbh geography: two stations feeding ingress,
shahi snan pressure landing on bathing ghats, an akhara camp grid with its ring
roads, pontoon bridges as the chokepoints, a bazaar, a medical post, and one
absorbing "snan complete" terminal. The 2019 Prayagraj Mela provides the shape —
and full survey-grade geodata of it is neither public nor worth licensing for a
toy-resolution simulation.

## Decision

`packages/core/src/crowd/sectors.ts` and `edges.ts` declare a **modelled** world
inspired by the 2019 grid:

- 24 sectors: 2 stations (Prayagraj Junction, Rambagh), 6 bathing ghats,
  5 parikrama temples, 8 akhara camps, `chaitanya-mela-bazaar`,
  `central-medical-post`, and `sangam-terminal` (the absorbing snan terminal).
- 54 edges: roads, 4 pontoon bridges (8–9 m wide, deliberately the narrowest
  arterials), the `sangam-overcross` corridor, rail sidings, and bath steps
  (4–7 m) that alone enter the Sangam terminal.
- Sector names carry Hindi names (`nameHi`) alongside ids, but numbers are
  rounded, hand-tuned working figures: areas in m² for density, service
  capacities per hour, and edge widths in meters — the last being the actual
  capacity law (`widthM × 46 people/min/m`).
- Every pilgrim's journey is BFS routing toward the wave's active target ghat;
  the terminal is reachable only through that ghat's outgoing snan edge.

## Consequences

- Numbers are defensible in docs and defensible in a scenario editor: nothing
  pretends to be official survey data.
- The topology is small enough (24 nodes, 54 edges) that BFS rows are trivial
  to warm up and `SectorGraph` tie-breaks stay trivially deterministic.
- People who know the real campus can still find their bearings — names,
  relative widths, and the pontoon-bridge chokepoint story are faithful.
- Changing the world is a data edit in one package; scenarios can monkey-patch
  nothing and still reshape the mela by directives and budgets.

## Alternatives considered

- **Real survey OSM import** — rejected: licensing weight, noisy edges the
  engine cannot calibrate, and faux precision the simulation does not have.
- **Purely abstract grid (A-F squares)** — rejected: kills the narrative hook;
  the whole point of the product is the real event's shape.
- **Editable map loading at runtime** — rejected: a persistence story this
  project deliberately does not have (see ADR 0005).
