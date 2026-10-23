# Agents service API (services/agents, Python FastAPI, :7332)

The crowd-marshal and risk-scoring service. Fully deterministic: identical
requests produce identical responses (same `seed+tick`, same bands, same
directives); no wall clock, no randomness beyond the seeded `Rng` chain.

Clients use `packages/sdk` (typed) and plain HTTP (below). Port is
`AGENTS_PORT`, default 7332.

## GET /healthz

```json
{ "ok": true, "fixture": "8-row self-test passed", "name": "crowd-marshal", "uptimeS": 92 }
```

```powershell
curl http://localhost:7332/healthz
```

## POST /assess

Risk scoring for a tick state — the service-built equivalent of `triage()`.
Front it with the snapshot v1 body or a pre-computed `TickResult` slice.

Request:

```json
{
  "seed": 7,
  "minute": 3600,
  "edgeStates": [{ "edgeId": "jhusi-pontoon", "flow": 540, "capacity": 368, "utilization": 1.47, "travelTimeMin": 14.2 }],
  "sectorStates": [{ "sectorId": "ramghat", "population": 88100, "density": 2.59, "jammed": false }]
}
```

Response:

```json
{
  "alerts": [{ "edgeId": "jhusi-pontoon", "score": 0.91, "band": "red", "label": "Sankat: Jhusi Pontoon" }],
  "worst": { "edgeId": "jhusi-pontoon", "score": 0.91 },
  "preDawnBoost": false
}
```

```powershell
curl -X POST http://localhost:7332/assess -H "content-type: application/json" -d @sample-state.json
```

## POST /marshal

The marshal brain: given a state and aggression, answer the exact
`CrowdDirectivePatch` the FSM would write.

Request:

```json
{ "seed": 7, "minute": 3610, "aggression": 0.55, "state": { "edgeStates": [], "sectorStates": [] } }
```

Response — the same shape the TS engine ingests:

```json
{ "patch": { "edges": { "jhusi-pontoon": 0.4, "phaphamau-pontoon": 1.2 }, "sectors": { "ramghat": 0.8 } },
  "phase": "MONITOR", "reasoning": ["saturation grace expired", "downstream density cooling"] }
```

```powershell
curl -X POST http://localhost:7332/marshal -H "content-type: application/json" -d @sample-state.json
```

## POST /parity

Echo-scoring for the fixture runbook: posts the 8 shared rows, returns per-row
bands. Consumed by `docs/runbooks/parity.md`.

```powershell
uv run pytest tests/test_parity.py    # wraps /parity, asserts band equality with TS
```

## Notes

- Payload limits: one state per request, ≤ 64 edges (the whole world is 54).
- No auth by design (zero-keys principle) — bind to loopback/network-internal
  addresses; the compose network serves it as `http://agents:7332`.
- 422 on schema mismatch with a zod-style field path in the error body; 500
  handles are never swallowed — determinism faults are loud.
