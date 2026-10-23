# Glossary

One sentence each. Kumbh vocabulary first, then engine nouns, then app nouns.

## Kumbh vocabulary

- **Shahi snan** — a royal bathing day on which akhara orders lead processions into the river; three per 7-day run (Makar Sankranti, Mauni Amavasya, Vasant Panchami).
- **Snan** — the ritual bath itself; in the engine, crossing an edge into the `sangam-terminal` sector counts as snan.
- **Snan count** — the cumulative number of pilgrims who have completed the bath (`CrowdSim.snan`).
- **Kalpvasi** — a pilgrim who camps at the mela for its whole month; modelled as resident camp-sector mass between waves.
- **Akhara** — a monastic order's camp; eight sector tiles here, each with a service capacity and ring-road links.
- **Pontoon bridge** — a temporary floating bridge; the four narrowest arterial edges (8–9 m) and the engine's intended chokepoints.
- **Parikrama** — the circumambulation path around the sacred perimeter, binding the five temple sectors with ring-road edges.
- **Ghat** — a riverside bathing terrace; six bathing ghats, each the target of a rotating arrival wave.
- **Triveni Sangam** — the confluence itself, the funnel into which every bath step drains before the terminal absorbs it.
- **Bazaar** — the festival market; the `chaitanya-mela-bazaar` sector plus the `BazaarSim` vendor layer that live inside it.

## Engine nouns

- **Sector** — one of 24 world nodes holding conserved mass, with an area in m² for density math.
- **Edge** — one of 54 flow surfaces whose capacity is `widthM × 46 people/min`; `travelTimeMin` is its length divided by friction-scaled walk speed.
- **Sector graph** — the precomputed BFS hop-distance store over 24×54 whose first-seen-edge order is the engine's tie-break.
- **CrowdSim** — the deterministic tick engine: seeded arrivals, snapshot-based edge flows, terminal drain.
- **Tick** — one minute of simulated mela time, numbered from 1; a full run is 10,080 ticks.
- **TickResult** — a tick's payload: `sectorStates`, `edgeStates`, `gotSnan`, `totalMoved`.
- **Wave** — an arrival schedule entry (8 per run); the three Shahi waves carry weights 0.18/0.42/0.22 and arrival channels feed the two stations at 1,250–1,500 people/min.
- **Rng** — the only sanctioned randomness: an FNV-1a-namespaced seed driving a mulberry32 stream (`crowd::`, `waves::`, `sample::`).
- **FNV-1a** — the 32-bit string hash used both to expand seeds and to fingerprint state.
- **stateHash** — the 8-hex FNV-1a fingerprint of a snapshot's canonical body; equal hash means equal state.
- **Snapshot v1** — the canonical JSON world state (versioned field, fixed sector order) that restore and replay consume (ADR 0009).
- **`TimelinePlayer`** — the replay engine behind `/replay`: records snapshots as you run and scrubs by restore.
- **MarshalBrain** — the deterministic field-officer FSM that ranks risk and writes directives (OBSERVE → RANK → ACT → MONITOR).
- **Directive** — a capacity or demand multiplier patch per edge or sector; composes multiplicatively and clamps per surface into [0.05, 2.5], the picket's work in engine terms.
- **Overlay** — the canvas drawing layered atop the base map: risk bands, directive arrows, hover labels.
- **`BazaarSim`** — the emergent vendor economy: density → demand → price → revenue → restock, a one-way observer of the swarm.
- **`RailScheduler`** — the timetable layer that releases platform cohorts into the same tick math as walking arrivals.
- **Triage** — the one deterministic pass over `edgeStates` scoring each surface and returning alerts worst-first.
- **Risk band** — the bucket a risk score lands in: green, amber (0.35), orange (0.6), red (0.85); the score blends utilisation 55%, crush-density saturation 30%, halted time 15%.
- **Crush density** — the 4 people/m² standing cap that triggers `jammed`; even at full crush an 8% friction floor keeps a residue of flow.
- **BPR** — the Bureau of Public Roads travel-time formula the Rust parity engine uses (α = 0.15, β = 4) to mirror the TS engine's edge behaviour on a shared 8-row fixture.
- **Sample agents** — the deterministic representative particles `sampleAgents()` draws for renderers — a sampling of the mass, never agents.
- **Scenario** — a zod-validated JSON world variant (`totalPilgrims`, overrides, closures, aggression), zero code; eight ship by default.

## App and ops nouns

- **`apps/web`** — the Next 16 App Router workspace: 11 routes, canvas shell, palette, REST adapters.
- **cmdk palette** — the Ctrl+K command box wiring actions such as "apply scenario".
- **`/replay`** — the time-machine route: snapshot timeline plus the seed/tick/stateHash sharing triple.
- **`packages/sdk`** — the typed TypeScript client for the Python agents service.
- **ADR** — architecture decision record; ten live under `docs/adr/`, each dated with its alternatives recorded.
