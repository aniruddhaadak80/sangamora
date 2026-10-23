# ADR 0006 — Polyglot split: Rust wasm parity engine, Python marshal service, Go SSE relay

Date: 2026-10-23
Status: Accepted

## Context

The core simulation must stay TypeScript (it runs in the browser and must be
inspectable by every contributor). But three jobs actively want different
language homes: a bit-exact referee for the hot math, a comfortable home for the
marshal/risk service, and a lean broadcaster for server-side event fan-out.
Each was argued on its own merits; the split survived because each piece has a
single reason to exist.

## Decision

Three satellite components with the `packages/core` trajectory numbers locked
against them:

- **`crates/flow` (Rust → wasm, optional at runtime)** — the parity referee.
  It re-implements edge travel time and stress with BPR α=0.15, β=4 and is
  validated on one shared 8-row fixture with the TS engine. `cargo test` and
  `bun test` must agree to tolerance; the wasm bindgen build is an optional
  hot-path accelerator, never a correctness dependency.
- **`services/agents` (Python, FastAPI, port 7332)** — the crowd-marshal and
  risk-scoring service. Deterministic: same request `seed+tick` → same scoring
  and directive. Python is where practitioners pull `pip install fastapi`
  thinking; the SDK client (`packages/sdk`) types it for the web app.
- **`services/relay` (Go, port 7331)** — SSE broadcast hub with `/publish` and
  `/stream`, hub-fanout over goroutines. Go earns its slot by making one
  embarrassing number disappear: memory per thousand SSE connections.

Nothing else goes polyglot. UI, docs, and the engine stay TS-first.

## Consequences

- Every engine constant now exists in two languages — the fixture is the only
  thing holding them together, so it is treated as a source-of-truth artefact.
- CI grows to four matrices (bun, pytest, cargo, go) — slower, but each is
  cache-friendly and each fails on a clearly-owned surface.
- Contributors pick a component boundary instead of a language debate: parity
  changes touch the fixture first, then both implementations.

## Alternatives considered

- **All TypeScript (bake marshal+relay into Next API routes)** — rejected: SSE
  fan-out on a JS server has its own scaling misery, and parity testing inside
  the process under test is self-certification.
- **Rust core compiled to napi + wasm dual** — rejected: the browser is the
  primary home; a second binding is build-system noise until profiling begs.
- **Elixir/Phoenix pubsub for the relay** — rejected: brilliant fit, but one
  more runtime for ops; Go is the least-surprising SSE hub.
