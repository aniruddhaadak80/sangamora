# ADR 0009 — Snapshot format v1: canonical JSON + FNV-1a hash, versioned field

Date: 2026-10-23
Status: Accepted

## Context

Replay, scenario diffing and cross-service verification all hang on one
question: is the engine's state *this* state? A snapshot format is therefore a
contract, not an implementation detail — it will be parsed by tests, the
Python service, possibly the relay, and hand-inspected by contributors in the
`/replay` route. It must be boring and impossible to misread.

## Decision

`Snapshot v1` is canonical JSON with a version field on top:

```json
{
  "v": 1,
  "seed": 7,
  "minute": 4315,
  "totals": { "injected": 5120334, "exited": 4981120, "snan": 4603211 },
  "populations": [ /* sectors in the fixed SECTORS order, full float64 precision */ ],
  "multipliers": { "edges": { "jhusi-pontoon": 0.4 }, "sectors": { "rambagh": 1.2 } },
  "stateHash": "9f2c71bd"
}
```

- **Canonicality**: populations are listed in the engine's fixed `SECTORS`
  order — never sorted, never keyed by id — so the array is positional. Map
  keys in `multipliers` use the engine's insertion order (first-apply order),
  and the serializer emits plain numbers in decimal straight from `Float64Array`
  values, no rounding.
- **`stateHash`** is FNV-1a 32-bit, computed over the canonical body *with the
  hash field omitted*, emitted lowercase 8-hex. Same state → same hash on any
  machine; the hash is the fingerprint users paste.
- **`v` gates reading**: a parser that meets an unknown version refuses to
  restore ("unsupported snapshot v.N") rather than best-effort guessing.
  Forward migration is a researched decision made with the fixture suite, not
  an accident.

## Consequences

- Reproducing a run is deterministic both ways: restore a snapshot and the
  engine continues with the universe exactly as it was.
- The hash is 32 bits — collision-resistant enough for human-facing
  fingerprints, explicitly *not* a cryptographic guarantee; the canonical body
  is the arbiter in tests, the hash is a quick view.
- Any producer (Rust parity tool, Python service) can emit v1 with no
  implementation copy needed beyond the field list above.

## Alternatives considered

- **CBOR/MessagePack binary frames** — rejected: cheap bytes, expensive
  human-debugging; JSON wins where the diff/read story matters.
- **Full historical log of directives instead of on-demand snapshots** —
  rejected: replaying-to-tick is what `TimelinePlayer` does anyway; snapshots
  answer the *is-it-this-state* question directly.
- **SHA-256 instead of FNV-1a** — rejected: 64 hex chars users will not paste;
  the project's determinism story is trust-through-reproduction, not crypto.
