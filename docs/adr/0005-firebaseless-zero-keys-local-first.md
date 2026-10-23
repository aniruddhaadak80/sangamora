# ADR 0005 — Firebaseless, zero-API-keys, local-first state

Date: 2026-10-23
Status: Accepted

## Context

The sandbox's credibility rests on two claims: everything runs offline, and the
same seed reproduces the same universe byte-for-byte. Any backend dependency —
a hosted realtime database, auth, presence — threatens both, and the demo
story completely dies the moment someone needs an API key to try it.

## Decision

Zero keys, no database, minimal state held locally:

- All state that matters is **derivable**: `CrowdSim` reconstructs the entire
  7-day world from `{ seed, tick, directive history }`. A scenario is a small
  JSON literal, not a database row.
- `stateHash` (FNV-1a over the canonical snapshot, see ADR 0009) is the state
  fingerprint; sharing a run means sharing `seed + tick + hash`, not a URL
  against a server.
- The web app's REST adapters (`/api/healthz`, `/api/directive`, `/api/scenarios`,
  `/api/calendar`, `/api/bazaar`) are thin functions over the same in-process
  engine — no caching layer, no ORM, no session store.
- The Python marshal service (:7332) and Go relay (:7331) are stateless or use
  an optional local `./.data` volume for the Docker compose path — nothing
  phone-homes.
- Auth is not part of the product; rate limits are per-service built-ins, not
  an identity system.

## Consequences

- `bun install && bun dev` is literally the whole onboarding; no signup can
  ever gate work.
- Multiplayer/persistence (roadmap M4) arrives as an opt-in session service,
  layered on the relay — the core never depends on it.
- Nothing can leak a secret because there are none to leak; CI needs no env
  beyond `MELA_SEED`, `NEXT_PUBLIC_SITE_URL`, `RELAY_PORT`, `AGENTS_PORT`.
- Hard ceiling acknowledged: cross-device cloud saves are out of scope, and
  that is fine for a simulation sandbox.

## Alternatives considered

- **Supabase/Firebase for scenario sharing** — rejected: an account wall plus
  provider noise in exchange for something `seed=…&tick=…` already gives.
- **SQLite at rest in the browser (OPFS)** — rejected: a database to preserve
  re-derivable state is cost without a payoff; snapshot JSON does the job.
- **Env-var-gated telemetry** — rejected: the zero-keys principle is absolute.
