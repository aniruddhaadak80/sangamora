# Replaying the mela — the time machine and stateHash

The `/replay` route is the sandbox's honest ledger: every tick of a run is
addressable, fingerprinted and shareable.

## What a run remembers

The `zustand` sim-store records one snapshot v1 frame per recorded tick (user
chooses cadence; the default is every 60 sim-minutes). Snapshots hold
(via ADR 0009):

- `seed`, `minute`, accumulation totals (injected/exited/snan),
- `populations` in the fixed `SECTORS` order,
- active `multipliers` (edges, sectors, composed and clamped),
- `stateHash` — FNV-1a 32-bit, 8 lower-case hex chars.

## Driving `TimelinePlayer`

```ts
const player = new TimelinePlayer();          // records as you run
player.record(sim.snapshot());
// ... more ticks ...
const frame = player.goto(4315);              // minute 4315 = day 3, 23:55
sim.restore(frame);                           // stateHash matches parse
console.log(frame.stateHash);                 // e.g. "9f2c71bd"
```

Scrubbing backwards is snapshot-restore, never fast-reverse integration —
reverse exactness is why the format carries mid-register floats, not rounded
display numbers.

## Sharing a run

The `/replay` header shows `seed=7&tick=4315&hash=9f2c71bd`. Two people who
paste identical triples into identical code can *prove* they see the same
universe — the canvas must agree with the hash, or one party is running
modified code. This is the zero-keys sharing story (ADR 0005): no server, no
account, no cloud record.

## Troubleshooting

- **Hash mismatch on a friend's machine?** One of you changed engine code
  (a constant, an Rng call order). The hash is a build fingerprint, not a
  bug in the replay.
- **Frames missing?** Recording cadence is configurable; cheap frames are the
  reason scrubbing stays smooth on `/analytics` overlays.
- **Restore refused?** The snapshot `v` field is checked, and unknown
  versions refuse loudly rather than guess (ADR 0009).
