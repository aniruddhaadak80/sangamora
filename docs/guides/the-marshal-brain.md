# The marshal brain

`MarshalBrain` is the deterministic field officer of the sandbox: it watches
tick results and writes capacity/demand directives. No LLM, no cloud, no
serpentine of agents — a finite state machine with a scoreboard.

## The loop: OBSERVE → RANK → ACT → MONITOR

| phase | job |
|---|---|
| OBSERVE | consume `TickResult`; bolt on pre-dawn weighting (03:00–06:00 × 1.06) |
| RANK | `triage()` scores every edge: 55% utilisation, 30% crush-density saturation, 15% halted-time (tanh); narrow edges (<18 m) gain up to +8% |
| ACT | emit a `CrowdDirectivePatch` on edges scoring ≥ amber (0.35) |
| MONITOR | let the patch work; decay or revert it when utilisation normalises |

## The patch

```ts
sim.directive({
  edges: { "jhusi-pontoon": 0.4 },          // cap the chokepoint
  sectors: { ramghat: 0.8 },                // damp demand near the ghat
});
```

Multipliers **compose multiplicatively** and clamp per edge into `[0.05, 2.5]`.
Everything is capacity/demand scaling — never mass injection — so the
conservation identity `Σ populations + exited === injected` survives any patch.

## Determinism notes

- Sort key: `riskScore` descending; ties break by `edgeId` ascending.
- Resting state is a pure function of `(state, aggression)` — same inputs, same
  directive; the Python service (`services/agents`) does the same scoring for
  external SDK clients at port 7332.
- Hotspot labels (`hotspotName()`) are string-stable: a red ghat edge always
  reads "Sangam upper ghat submerging".

## Tuning aggression

Aggression is a scenario knob, not a code change: `2019-realistic` nudges at
0.35+, `dayan-impossible` fires on nearly everything. The quadrant chart in
`docs/diagrams/metrics-quadrant.mmd` positions all eight shipped scenarios.

## Debugging a directive that "didn't work"

1. Confirm the edge id exists (unknown ids throw — never silently no-op).
2. Check the composed multiplier after clamping; repeated patches can
   saturate at 0.05 or 2.5 and need a MONITOR reset.
3. Print `edgeStates[...].capacity` before/after: capacity is the honest
   ledger of what actually changed.
