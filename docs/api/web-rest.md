# Web REST API (apps/web)

Thin adapters under `apps/web/src/app/api/*`. Every route is a function over
the same in-process deterministic engine — no database, no sessions (ADR 0005).
Errors are JSON `{"error": string}` with honest status codes; unknown ids
throw by design (`CrowdSim.directive` never silent-no-ops).

All examples against `http://localhost:3000`.

## GET /api/healthz

Boot status of the web app plus the engine's seed echo.

```json
{ "ok": true, "seed": 7, "uptimeS": 184, "routes": 11, "engine": "edge-flow v1" }
```

```powershell
curl http://localhost:3000/api/healthz
```

## POST /api/directive

Carry one tidy directive into a seeded run and return the resulting tick.
Body: `{ "seed": number, "tick": number, "patch"? : { "edges"?, "sectors"? } }`.

- `seed` — 0..2³²−1 (validated; the engine asserts "invalid options" otherwise).
- `tick` — 1..10080 (7 days × 1440 min). The route fast-forwards a fresh
  `CrowdSim({ seed })` to `tick` by replaying the deterministic timeline.
- `patch` — optional `CrowdDirectivePatch` applied at that tick.

```json
{ "tick": 4315, "seed": 7, "patch": { "edges": { "jhusi-pontoon": 0.4 } } }
```

Response (trimmed):

```json
{
  "stateHash": "9f2c71bd",
  "minute": 1,
  "gotSnan": 12210,
  "totalMoved": 186300,
  "sectorStates": [{ "sectorId": "prayagraj-jn", "population": 412300, "inflow": 1150, "outflow": 800, "density": 3.44, "jammed": false }],
  "edgeStates": [{ "edgeId": "jhusi-pontoon", "flow": 540, "capacity": 368, "utilization": 1.47, "travelTimeMin": 14.2 }]
}
```

```powershell
curl -X POST http://localhost:3000/api/directive -H "content-type: application/json" -d "{\"seed\":7,\"tick\":4315}"
```

## GET /api/scenarios

The eight shipped scenarios, each with its pinned `inspectAt` minute.

```json
{ "scenarios": [
  { "id": "2019-realistic", "label": "2019 realistic baseline", "totalPilgrims": 5200000, "marshalAggression": 0.55, "inspectAt": 3600 },
  { "id": "dayan-impossible", "label": "11M stress test", "totalPilgrims": 11000000, "marshalAggression": 0.9, "inspectAt": 6720 }
] }
```

```powershell
curl http://localhost:3000/api/scenarios
```

## GET /api/calendar

The 7-day window with Shahi snan anchors and their wave weights (post-seed
jitter for the given `?seed=`).

```json
{ "seed": 7, "days": [
  { "day": 1, "label": "Makar Sankranti Shahi Snan", "startHr": 10.4, "weight": 0.18, "shahi": true },
  { "day": 3, "label": "Mauni Amavasya Shahi Snan", "startHr": 58.2, "weight": 0.42, "shahi": true },
  { "day": 6, "label": "Vasant Panchami Shahi Snan", "startHr": 130.1, "weight": 0.22, "shahi": true }
] }
```

```powershell
curl "http://localhost:3000/api/calendar?seed=7"
```

## GET /api/bazaar

The `BazaarSim` ledger at the requested tick: prices, stock, restock queues.

```json
{ "seed": 7, "minute": 3600, "items": [
  { "id": "garland", "avgPrice": 34.5, "stock": 118, "restockLeadMin": 45, "revenueToday": 92400, "stockedOut": false }
] }
```

```powershell
curl "http://localhost:3000/api/bazaar?seed=7&tick=3600"
```

## Conventions

- Q params accept `seed` (default `MELA_SEED`) and `tick` (default current).
- All responses carry the `stateHash` of the state they describe where
  meaningful; comparisons across machines must match (ADR 0009).
- No pagination anywhere — response sizes are bounded by the fixed world.
