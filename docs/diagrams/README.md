# Diagrams

Mermaid sources for every architectural spot in sangamora. They render
natively on GitHub (no prebuilt SVG involved); `docs/README.md` links here and
the README embeds a couple verbatim when it lands.

## Index

| diagram | purpose |
|---|---|
| `architecture.mmd` | whole-repo flowchart: client, engine, services, seed, wasm |
| `request-flow.mmd` | one tick, end to end: palette → zustand → CrowdSim → triage → canvas |
| `domain-model.mmd` | ER view: waves, trains, sectors, edges, directives, vendors, snapshots |
| `marshal-fsm.mmd` | MarshalBrain state machine: OBSERVE → RANK → ACT → MONITOR |
| `ci-cd.mmd` | push → CI matrix (bun, pytest, cargo, go, loc) → Vercel → optional Docker |
| `user-journey.mmd` | visitor path: landing → explainer → first run → replay → PR |
| `mindmap.mmd` | whole product at a glance: engine, UI, services, docs, ops |
| `gitgraph.mmd` | main ← develop ← feature/* model with `v0.1`, `v0.2` tags |
| `roadmap.mmd` | gantt: M0 shipped core → M4 relay sessions |
| `class-diagram.mmd` | core classes: CrowdSim, SectorGraph, Rng, MarshalBrain, BazaarSim… |
| `metrics-quadrant.mmd` | the eight scenarios on control strength vs compute cost |
| `infra.mmd` | containers and ports for compose: 3000 / 7331 / 7332 + `./.data` |
| `waveforms.mmd` | arrival-rate series over the 7-day window (Shahi bumps + lulls) |
| `economy-loop.mmd` | the bazaar feedback loop and its one-way contract with the swarm |

## Embedded previews

### request-flow.mmd

```mermaid
sequenceDiagram
  autonumber
  actor U as Visitor
  participant Z as zustand sim-store
  participant C as CrowdSim
  participant T as triage / riskScore
  participant V as canvas + recharts overlay
  participant H as stateHash ledger

  U->>Z: press "run one minute" (or palette action)
  Z->>C: tick()
  C->>C: arrivals - 3 channels, wave-gated, budget-checked
  C->>C: edge flows = min(capacity, demand) x friction, from snapshot
  C->>C: Sangam terminal drains 2600/min
  C-->>Z: TickResult { sectorStates, edgeStates, gotSnan, totalMoved }
  Z->>T: triage(edgeStates, sectorStates, minute)
  T-->>Z: alerts worst-first + hotspot label
  Z->>V: render sector discs, edge bands, charts
  Z->>H: fingerprint state, append { tick, stateHash }
  H-->>U: /replay timeline row
```

### architecture.mmd

```mermaid
flowchart LR
  subgraph browser["Browser client - apps/web (Next 16 App Router)"]
    pages["App Router pages<br/>/  /map  /risk  /bazaar  /rails  /sectors<br/>/replay  /calendar  /analytics  /scenarios  /explainer"]
    store["zustand sim-store"]
    api_routes["REST adapters - thin<br/>api/healthz  api/directive  api/scenarios  api/calendar  api/bazaar"]
  end
  subgraph engine["packages/core - deterministic crowd engine"]
    CrowdSim["CrowdSim<br/>24 sectors / 54 edges"]
    triage["triage + riskScore"]
  end
  seed["packages/seed fixtures"]
  wasm["crates/flow (Rust wasm, optional)"]
  agents_svc["services/agents :7332 - Python FastAPI"]
  relay_svc["services/relay :7331 - Go SSE"]

  pages --> store --> CrowdSim
  CrowdSim --> triage --> store
  seed --> CrowdSim
  wasm -.-> CrowdSim
  store --> api_routes --> relay_svc
  relay_svc -- "SSE stream" --> store
```

## Authoring notes

- Theme init (`%%{init:...}%%`) with the saffron palette (`primaryColor`
  `#FF8A00`) sits on every diagram that supports it; keep new diagrams aligned.
- Keep node labels quoted, no raw `<`/`>` characters outside labels, and no
  `:` syntax inside flowchart labels (use `&#58;` or hyphens).
- Do not regenerate these by hand into other formats — a wave-2 docs embed
  consumes `.mmd` sources directly.
