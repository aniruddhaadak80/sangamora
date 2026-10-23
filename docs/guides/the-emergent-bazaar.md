# The emergent bazaar

`BazaarSim` is the economy layers on top of the crowd engine: vendors keep
carts at the bazaar and the ghats, crowd waves make demand move, and the
market finds its own prices. It is the place the sandbox gets *unfaithful*
drama — traders behave like traders, never like pilgrims.

## The loop

1. **Arrival waves** (`PILGRIM_WAVE`) land people at ghats and camps.
2. **Local density** — `CrowdSim.sectorStates` — decides foot-traffic at each
   vendor tile; willingness-to-pay rises with dwell time.
3. **Demand signal** per item (from `packages/seed` `bazaar-items.json`:
   chappals, garlands, water, chai, idol prints…) — computed as nothing more
   mysterious than a lookup curve of local density × dwell.
4. **Price adjust** — vendors nudge prices within an item-specific band.
5. **Revenue** accrues per sale; receipts are deterministic.
6. **Restock lead time** — an order placed now arrives `restockLeadMin`
   minutes later (seeded jitter, ±10%).
7. **Stockout** — an empty cart suppresses sales until the truck lands; the
   visual is a greyed cart on the canvas, not a ledger error.

The loop closes on vendors, never on the swarm: the bazaar observes density
but cannot redirect it, so no eco-feedback can destabilise the engine's
conservation guarantees (ADR 0001).

## Reading the state

```ts
const bazaar = new BazaarSim(seed);   // packages/core
bazaar.step(sim.tickResult);          // advance one minute of market time
bazaar.vendors // [{ id, item, stock, price, restockLeadMin, revenue }]
```

The `/bazaar` route charts price drift against crowd density; the `/api/bazaar`
endpoint exposes the same ledger as JSON for dashboards.

## Reproduce a day's market

Same seed + same tick = same receipts. Try Mauni Amavasya (hour ~58+): garland
prices climb before the spike, chappal vendors stock out first — water never
stockouts at 2019-realistic scale, a detail intentional in the item's demand
curve.

## Extending

- Add items to `bazaar-items.json` (zod-validated; then `bun run generate`).
- New vendor behaviour belongs in `BazaarSim` methods, not the canvas.
- Keep the ledger deterministic: no wall-clock, only sim-minutes.
