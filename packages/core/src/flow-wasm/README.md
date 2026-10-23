# flow-wasm — the BPR edge-flow kernel and its Rust ⇄ TS ⇄ Python parity contract

`sangamora` models the mela as **edge-flow between sectors**: each edge carries a
flow `v` against a capacity `c` (people/min). The ONE formula every shared
runtime must agree on is the **BPR actuator**:

```
stress        = v / c
travelTimeMin = freeTimeMin × (1 + alpha × (v/c)^beta)      alpha = 0.15, beta = 4
```

The three bit-identical twins:

| Language | Location | Role |
| --- | --- | --- |
| TypeScript | `packages/core/src/flow-wasm/engine.ts` (+ this folder's `wrapper.ts` / `wasm.ts`) | reference kernel, always available |
| Rust | `crates/flow/src/lib.rs` | wasm-pack accelerator + native tests |
| Python | `services/agents/app/engine.py` | crowd-marshal FastAPI service (`/risk`, `/directive`) |

## The parity contract (keep all five, or the twins drift)

1. **Same constants** — `alpha = 0.15`, `beta = 4` (standard BPR exponents).
2. **Same saturation ladder** (no panics anywhere, no NaN surprises)
   `c <= 0` → `+∞` if `v > 0` else `0`; `v <= 0` → `0`; `freeTimeMin <= 0` → `0`.
   (zod/pydantic bound valid domain data to `c >= 1e-6`, so Infinity never
   reaches JSON.)
3. **Same multiplication chain** — `s = v/c; r2 = s*s; r4 = r2*r2; tt = free * (1 + 0.15*r4)`.
   WHY NOT `pow(x, 4)`: IEEE 754 guarantees identical rounding for `+ - * /`
   in every compliant runtime, but **not** for `pow` — a language using pow may
   differ in the last ulp and a sandbox claiming deterministic parity must not
   depend on libm luck. Two squares are exactly-rounded everywhere.
4. **Same fixture** — `__fixtures__/flow.json` is mirrored **byte-for-byte** to
   `services/agents/tests/fixtures/flow.json` and `crates/flow/tests/fixtures/flow.json`
   (+ `packages/sdk/tests/fixtures/flow.json` for the SDK client tests). Eight
   rows covering the corners: `v=0`, `v=c`, `v=0.5c`, `v=1.6c`,
   `v=7.2c` with capacity 1, huge 2019-scale pilgrimage numbers (~5.2M), and a
   fractional calm row.
5. **Same decimal anchors, tolerance 1e-9** — each twin's parity test asserts
   these exact-decimal expectations:

| edgeId | stress | travelTimeMin |
| --- | --- | --- |
| station-yard-idle | 0 | 12 |
| jhusi-pontoon-packed | 1 | 9.2 |
| sangam-marg-half | 0.5 | 10.09375 |
| bath-gau-jam | 1.6 | 27.76256 |
| triveni-causeway-tiny-cap | 7.2 | 808.21568 |
| prayagraj-jn-megacrowd | 5.2 | 4980.3408 |
| samudra-manthan-tide | 1 | 12.65 |
| shanti-quarter-calm | 0.15 | 5.50041765625 |

Any implementation drifting off IEEE-754 double semantics (a classic wasm /
JS trap is pow-based shortcuts) fails these to-the-decimal assertions.

## Building the wasm blob (OPTIONAL — absence is fine)

The repo runs with zero build steps: `wasm.ts` returns `null` when `pkg/`
doesn't exist and `solveEdges` silently uses the TS Local engine. `pkg/` is
git-ignored. If you DO want the Rust-native path:

```sh
cd crates/flow
wasm-pack build --target web --out-dir ../../packages/core/src/flow-wasm/pkg --out-name flow_engine
```

Then, once per host process:

```ts
import { loadFlowWasm, solveEdges } from "./wasm";

await loadFlowWasm();            // false when pkg/ is absent — harmless
solveEdges(rows);                // wasm when loaded, identical Local otherwise
```

## API

- `engine.ts` — `BPR = { alpha: 0.15, beta: 4 }`, `stress(v, capacity)`,
  `travelTimeMin(v, capacity, freeTimeMin)`
- `wrapper.ts` — zod schemas (`FlowFixtureRowSchema`, `FlowResultSchema`) +
  `solveEdgesLocal(rows) → readonly FlowResult[]`
- `wasm.ts` — `loadFlowWasm() → boolean`, `solveEdgesWasm(rows) → readonly FlowResult[] | null`
  (null = "fallback"), `solveEdges(rows)` (pre-load-aware, falls back)

## Tests

```sh
cd packages/core
bunx vitest run tests/flow.parity.test.ts
```

Rust sibling: `cargo test` inside `crates/flow`; Python sibling:
`python -m pytest services/agents`.
