# Local development

Everything offline, everything Bun. No keys, no accounts, no mocks to stitch.

## Prerequisites

- Bun ≥ 1.3 (`bun --version`), Node ≥ 20.9 (for tooling that needs it).
- Optional: Rust toolchain for `crates/flow` parity work, Python ≥ 3.12 for
  `services/agents`, Go ≥ 1.24 for `services/relay`.

## Setup

```powershell
bun install
bun run typecheck   # turbo: next typegen && tsc --noEmit per workspace
bun run lint        # strict flat eslint across workspaces
bun run test        # vitest suites (parity fixtures included)
```

## Run the web app

```powershell
bun run dev         # turbo dev: apps/web on http://localhost:3000
```

Open [http://localhost:3000/map](http://localhost:3000/map) — the swarm canvas
boots at seed 7. Press `Ctrl+K` for the cmdk palette; type "apply scenario".

Optional env (see `.env.example`): `MELA_SEED` (default 7), `NEXT_PUBLIC_SITE_URL`,
`RELAY_PORT` (7331), `AGENTS_PORT` (7332). Turbo injects declared vars via
`globalEnv` — keep new ones in `turbo.json`'s `globalEnv` or they vanish in CI.

## Run the satellites

```powershell
# terminal 2 — Python crowd-marshal service
cd services/agents && uv run uvicorn app:app --port 7332

# terminal 3 — Go SSE relay
cd services/relay && go run . --port 7331
```

Health checks: `curl http://localhost:3000/api/healthz`,
`curl http://localhost:7332/healthz`, `curl http://localhost:7331/healthz`.

## When apps call the engine

The browser runs `CrowdSim` in-process. The satellite services exist for SDK
clients, parity and fan-out — the web app does not need them to simulate.

## House rules

- `bun run generate` regenerates derived artefacts; `bun run generate:check`
  is the CI variant.
- Never write engine code that touches `Math.random` or `Date.now` — the
  linter bans both inside `packages/core` (see ADR 0010).
- Conventional Commits only: `feat(core): warm pontoon BFS rows lazily`.

Common failure: CSS silently missing in dev means the
`@tailwindcss/turbopack` rule was dropped from `apps/web/next.config.ts`.
