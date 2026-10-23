# Wasm and Rust parity

`crates/flow` is the ledger that proves the TS engine's numbers on the record.
It never owns correctness; it demonstrates it.

## What lives in the crate

- The BPR-style stress parameterisation of edge travel time: `α = 0.15`,
  `β = 4` — the canonical Bureau of Public Roads pair (ADR 0004).
- An 8-row shared fixture (`density, width, target flow → travelMin/stress`)
  committed in both `crates/flow/tests/fixture.json` and the TS test tree.
- A wasm-bindgen build so the crate can later slot **in** the tick loop as a
  hot-path accelerator (roadmap M3).

## Building and testing

```powershell
# once
rustup target add wasm32-unknown-unknown

cargo test -p flow          # parity fixture: asserts against TS ground truth rows
wasm-pack build --target web crates/flow --out-dir ../packages/core/src/generated/flow
```

The TS side reads the same fixture:

```powershell
cd packages/core; bun test .  # parity rows must match row-for-row
```

## The rule for constant changes

A constant change is one PR, both languages, the fixture updated by hand:

1. Update `fixture.json` (both copies stay byte-identical).
2. Update `packages/core` constants (they carry `WHY` doc comments).
3. Update the Rust parameterisation.
4. `cargo test` + `bun test` must go green together; a single-language change
   is rejected in review.

## When wasm is *actually* used

Today: nothing in production loads the wasm blob; the TS engine is fast enough
at 24×54 scale. Tomorrow: `TimelinePlayer` scrubbing and multi-scenario batch
runs may offload the per-edge math. The integration point is a single seam —
`travelTimeMin` and the friction curve — so the swap is a factory function
change, not an engine rewrite.

## Common failures

- `wasm-pack` output path moved: `next.config.ts` `transpilePackages` won't
  rescue a package that emits ESM shims — keep the generated dir inside
  `packages/core/src/generated` and committed, per `turbo.json` `outputs`.
- Windows cold builds are slower than troubleshooting them: prefer
  `cargo test` on the fixture first; the fixture failing usually means someone
  changed a TS constant without the fixture bump.
