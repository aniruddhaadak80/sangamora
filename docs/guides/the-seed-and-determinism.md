# The seed and determinism

One seed, one universe. This guide shows the full conversion chain and how to
reproduce a `stateHash` by hand.

## The chain: string → FNV-1a → mulberry32 → Rng → CrowdSim

1. A user seed can be any integer 0..2³²−1 (`CrowdSimOptions.seed`, zod-checked).
2. Each subsystem expands **namespaced** strings through FNV-1a
   (`packages/core/src/rng/hashString.ts`):
   - `crowd::${seed}` → `CrowdSim`'s `Rng`
   - `waves::${seed}` → arrival wave jitter
   - `sample::${seed}` → renderer particles
   Namespacing means a wave change cannot desynchronise the crowd's jitter
   behaviour, and vice versa.
3. `mulberry32(seed)` (32-bit) produces the float stream; `Rng` wraps it behind
   `next() / int() / float() / pick() / shuffle() / weighted() / chance()`.
4. `CrowdSim` holds exactly one `Rng` and consumes it in a fixed order —
   3 float draws per tick (one per arrival channel). Call order is part of the
   contract; reordering calls changes the universe.

```ts
import { CrowdSim, hashString, Rng } from "@sangamora/core";
const sim = new CrowdSim({ seed: 7 });
sim.tick(); // crisp tick 1
```

## Reproducing a stateHash

```ts
import { CrowdSim } from "@sangamora/core";
const sim = new CrowdSim({ seed: 7 });
for (let i = 0; i < 100; i++) sim.tick();
const snap = sim.snapshot();           // snapshot v1 (see ADR 0009)
console.log(snap.stateHash);           // 8-hex FNV-1a over the canonical body
```

The hash is FNV-1a 32-bit over the canonical snapshot body with the hash field
omitted. Restoring `snap` into a fresh `CrowdSim({ seed: 7 })` must produce the
same byte-level state — tests assert `restore(snapshot()).stateHash === stateHash`.

## Verification recipe (PowerShell + Bun)

```powershell
bun repl
# paste the snippet above with seed 7, tick 100 → compare against a friend's output
```

Equal hash ⇒ equal universe, on any machine, any clock — timestamps do not
exist inside the engine.

## Hard rules

- No `Math.random`, no `Date.now` in engine code — lint-enforced.
- Pure, array-indexed tie-breaks everywhere: neighbourhood order is
  first-seen-edge order, alert sorting falls back to `edgeId` ascending.
- Seeded jitter lives only at the boundaries: wave `startHr ±1.5h`,
  weights `±6%`, arrival jitter `0.96..1.04`.
- A new random consumer? Add a new namespace (`"rail::${seed}"`, not `seed`),
  and pin its consumption order in tests before merging.
