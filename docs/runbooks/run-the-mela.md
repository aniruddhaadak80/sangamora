# Runbook — run the mela end-to-end

From clean clone to watching marshals handle the Mauni Amavasya spike, in
roughly five minutes. Windows PowerShell; on macOS/Linux swap nothing.

## 0. Install

```powershell
cd C:\Users\ANIRUDDHA\Desktop\Projects\sangamora
bun install
bun run typecheck
```

## 1. Start the web app

```powershell
bun run dev
```

`turbo dev` boots Next 16 (Turbopack) at http://localhost:3000.

## 2. Open /map and apply a scenario

1. Navigate to [/map](http://localhost:3000/map) — the swarm canvas (seed 7).
2. Press `Ctrl+K` to open the cmdk palette, type `apply scenario`, pick
   `2019-realistic`.
3. Press play (or palette `run minute` repeatedly). The heading should show
   `tick`, cumulative `snan` count and the current `stateHash`.

## 3. Watch marshals earn their keep

Apply `monsoon-surge`, then jump the wave clock: use `/replay`'s scrubber and
land on the Mauni Amavasya ramp (hour ~58). On the canvas:

- The amber/orange/red edge ribbons are triage alerts (worst-first).
- When a pontoon bridge goes orange, `MarshalBrain` emits a capacity patch;
  the utilisation band cools within a few ticks and the `/risk` board logs
  the directive ("Chokepoint Jhusi Pontoon").

## 4. Probe the REST surface (optional)

```powershell
curl http://localhost:3000/api/healthz
curl -X POST http://localhost:3000/api/directive -H "content-type: application/json" -d '{"seed":7,"tick":100}'
curl http://localhost:3000/api/scenarios
curl http://localhost:3000/api/calendar
curl http://localhost:3000/api/bazaar
```

## 5. Satellites (optional)

```powershell
# terminal 2
cd services/agents ; uv run uvicorn app:app --port 7332
# terminal 3
cd services/relay ; go run . --port 7331
```

`packages/sdk` talks to :7332; the relay fans out published state on :7331
(`/api/directive` publishes, SSE listeners stream).

## 6. Verify determinism as you go

At any point `/replay` shows `seed / tick / stateHash`. Two runs with the same
seed must reach identical hashes per tick — a mismatch means someone changed
engine internals, and the parity fixture should be the first suspect.

## If something is wrong

- CSS flatline in dev → `@tailwindcss/turbopack` rule missing (ADR 0002).
- 5xx on directives → engine threw on an unknown id; check `/api/healthz` log.
- Node ≥ 20.9 and Bun ≥ 1.3 are hard floors; older Buns ship a different
  lockfile parser and the workspace install stalls at seed packages.
