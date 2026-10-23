# Runbook — deploy

Two supported paths: Vercel (the fast, boring one for apps/web) and a CI-driven
preview on pull requests. The Python and Go satellites deploy separately.

## Path A — Vercel CLI

```powershell
bun i -g vercel   # once
cd apps/web
vercel link       # tie the workspace project
vercel --prod
```

Build runs Next 16 with Turbopack (the app's `next build`). Turborepo cache
warming on Vercel uses `turbo.json` outputs: `.next/**` (excluding
`.next/cache/**`), `dist/**`, `generated/**`.

## Environment variables (apps/web)

| var | used for | secret? |
|---|---|---|
| `MELA_SEED` | default sim seed on server-rendered pages | no |
| `NEXT_PUBLIC_SITE_URL` | canonical share links (seed/tick/hash URLs) | no |
| `RELAY_PORT` | relay default for local/relay deploys | no |
| `AGENTS_PORT` | agents default for local/agents deploys | no |

None are secrets — the zero-API-keys principle (ADR 0005) means nothing in the
environment is sensitive. Keep new vars declared in `turbo.json` `globalEnv`
or the Turborepo cache will under-run.

## Path B — GitHub Actions

`.github/workflows/ci.yml` runs the matrix (bun typecheck/lint/test, pytest,
cargo, go test, `scripts/loc-count.mjs` count). On green main merges, the
workflow triggers a Vercel production deploy; PRs get preview URLs. The
deploy step is an external (Vercel) integration — repository secrets hold the
Vercel token, nothing else.

## Satellites

- **services/agents (Python 7332):** container image via the repo's Dockerfile;
  deploy to any container host with `PORT=7332` and read-only FS. Health:
  `/healthz`.
- **services/relay (Go 7331):** single static binary; run with
  `--port 7331 --publish-rate 1s`. Health: `/healthz`.

## Post-deploy checks

```powershell
curl https://<host>/api/healthz                # web app, engine boot + seed echo
curl https://<host>/api/scenarios              # 8 scenarios render
curl https://<agents-host>:7332/healthz        # python service OK
curl -N https://<relay-host>:7331/stream       # SSE heartbeats within 2-3 s
```

## Rollback

Vercel: `vercel rollback` (instant, previous build). Satellites: redeploy the
previous image tag — they are stateless by design, so rollback carries no data.
