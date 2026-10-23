# Runbook — Docker and Compose (web + agents + relay)

The compose route is for demos and e2e parity checks: one machine, three
containers, zero host-language installs.

## Start

```powershell
docker compose up --build
```

Containers and ports:

| container | image | port | role |
|---|---|---|---|
| web | node:20-alpine + Bun install (Next 16 / Turbopack) | 3000 | UI + REST adapters |
| agents | python:3.12-slim (FastAPI) | 7332 | crowd-marshal + risk scoring |
| relay | golang:1.24-alpine build → scratch runner | 7331 | SSE broadcast |

If 3000/7331/7332 are taken on the host, edit the compose `ports:` left side
only — container-side ports are referenced by service names
(`http://agents:7332`) inside the network, never by hardcoded localhost.

## What state exists

`./.data` is mounted read-write into web and agents for optional snapshot
v1 files (offline archives, parity dumps). Deleting it is safe — the engine
re-derives everything from seeds. The relay is fully stateless.

## Health and smoke

```powershell
curl http://localhost:3000/api/healthz
curl http://localhost:7332/healthz
curl http://localhost:7331/healthz

# publish & watch fan-out
curl -X POST http://localhost:7331/publish -H "content-type: application/json" -d '{"type":"tick","seed":7,"tick":7}'
curl -N http://localhost:7331/stream
```

## Rebuild only one service

```powershell
docker compose build web
docker compose up -d web
```

## Stopping

```powershell
docker compose down          # keeps ./.data
docker compose down -v --rmi local   # also drops images (no volumes to lose)
```

## Known wrinkles

- Bun's `postinstall` (napi-postinstall) runs inside the image; the base image
  is pinned (`node:20-alpine`) — don't float it.
- The agents image bakes no runtime state: requests are answered purely from
  deterministic scoring; if you bump FastAPI versions, re-run the parity
  fixture (`docs/runbooks/parity.md`).
- Relay logs are structured single-line JSON; `docker compose logs -f relay`
  greps on `client=` for per-SSE debugging.
