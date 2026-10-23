# Sangamora Agents — Crowd Marshal Service (Python/FastAPI)

Deterministic crowd-marshal head of the sangamora sandbox. **Zero API keys,
zero network calls at rest** — the only caller-supplied input is the request
body itself.

## The shared math (parity contract)

Same BPR actuator as `packages/core/src/flow-wasm/engine.ts` and
`crates/flow/src/lib.rs`:

```
stress          = v / c
travelTimeMin   = freeTimeMin × (1 + 0.15 × (v/c)^4)
```

- `beta=4` is realized as two squared multiplies (`r4 = (s*s)*(s*s)`), never
  `pow` — the IEEE-754 cross-language bit-parity detail.
- Saturation ladder on degenerate inputs (c <= 0 -> +inf if v>0 else 0;
  v <= 0 -> 0; free <= 0 -> 0). Pydantic bounds valid domain data tighter
  (`c >= 1e-6`, `v <= 1e12`), so JSON output never contains Infinity.
- `tests/fixtures/flow.json` is a **byte-identical mirror** of
  `packages/core/src/flow-wasm/__fixtures__/flow.json`; the suite recomputes
  expected values inline (tolerance 1e-9) and pins the exact-decimal anchor
  table shared by the TS and Rust twins.

## Run

```sh
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --port 7332
```

| Endpoint | Maps to | Response |
| --- | --- | --- |
| `GET /healthz` | liveness | `{"ok": true}` |
| `POST /risk` `{edges: [row...]}` | BPR per edge (pure stdlib) | `{results: [{edgeId, travelTimeMin, stress}...], engine: "python-deterministic"}` |
| `POST /directive` `{seed, tick, edges: [...]}` | simplified MarshalBrain | `{seed, tick, strategy: "widen-worst-2", directives: [{edgeId, multiplier, rationale}...], engine}` |

Row shape (`row`): `{edgeId: string, v: number, c: number, freeTimeMin: number}` —
same as `__fixtures__/flow.json`.

`/directive` logic: rank each edge by BPR **stress** descending (tie-break
edgeId ascending — deterministic without hashing tricks), then widen the top 2
with multiplier `1.0 + 0.35 = 1.35` and emit rationale strings. `seed` is
validated + echoed but never enters numerics (the sandbox's randomness lives
TS-side only), so **two identical calls return byte-identical bodies** (proven
in `tests/test_api.py`).

Errors use a stable envelope the TS SDK maps onto `SdkError`:
`{"ok": false, "error": {"code": "validation" | "http", "message": "..."}}`
with HTTP 422 for schema violations.

FastAPI generates `/openapi.json` **at runtime only** — nothing generated is
committed. The SDK's optional contract loader skips documents that are absent.

## Tests

```sh
python -m pytest
```

- `tests/test_engine.py` — pure-kernel parity vs independently recomputed BPR
  + anchor table + saturation ladder + directive ranking/tie-breaks.
- `tests/test_api.py` — TestClient flows: healthz, /risk fixture parity,
  /directive determinism (byte-identical repeat calls), error envelope on
  invalid bodies (missing/negative/nonfinite/extra fields).

## Docker

```sh
docker build -t sangamora-agents .
docker run -p 7332:7332 sangamora-agents
```

Healthcheck uses stdlib `urllib` (python:3.12-slim ships no curl — same
request, no extra package).
