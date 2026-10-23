# flow_engine — Rust twin of the BPR edge-flow kernel

One formula, three languages, zero drift. `crates/flow/src/lib.rs` implements
exactly what `packages/core/src/flow-wasm/engine.ts` (TS) and
`services/agents/app/engine.py` (Python) implement:

```
stress        = v / c
travelTimeMin = freeTimeMin × (1 + 0.15 × (v/c)^4)      (standard BPR exponents)
```

## The parity contract (short version)

1. Constants `alpha = 0.15`, `beta = 4`.
2. Saturation ladder instead of panics: `c <= 0` → `+∞` if `v > 0` else `0`;
   `v <= 0` → `0`; `free <= 0` → `0`.
3. `beta` is realized as **two squared multiplies** (`r2 = s*s; r4 = r2*r2`),
   never `powf` — IEEE 754 does not guarantee cross-language identical
   rounding for `pow`, only for `+ - * /`.
4. Fixture `tests/fixtures/flow.json` is a **byte-identical mirror** of
   `packages/core/src/flow-wasm/__fixtures__/flow.json`; the tests recompute
   the expected values inline and also pin the exact-decimal anchors table
   (tolerance `1e-9`).

## Tests

```sh
cargo test
```

Covers: fixture↔independent-expected parity, decimal anchors, saturation of
degenerate inputs, and the wasm batch JSON API (garbage input → error, never
panic).

## Building the wasm blob (optional — the sandbox works without it)

```sh
wasm-pack build --target web --out-dir ../../packages/core/src/flow-wasm/pkg --out-name flow_engine
```

This emits `packages/core/src/flow-wasm/pkg/flow_engine(.js|_bg.wasm)`, which
`packages/core/src/flow-wasm/wasm.ts` picks up via a dynamic import. **If you
never run wasm-pack, nothing breaks**: the TS glue falls back to the
bit-identical pure-TS Local engine, and `pkg/` is git-ignored.
