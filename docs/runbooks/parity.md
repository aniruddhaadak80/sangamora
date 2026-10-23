# Runbook — parity: three engines, one fixture

Parity is a test, not a hope: the TS engine, the Rust crate and the Python
service all answer the same canonical questions from one committed fixture.

## The fixture

`8-row fixture` (committed in both `crates/flow/tests/fixture.json` and the
TS test tree): each row pairs inputs `(density people/m², width m,
targetFlow people/min)` → expected `travelTimeMin` and a stress scalar. The
numbers derive from ADR-0004 constants (46 p/min/m free-flow, 60 m/min walk
speed, BPR α=0.15 β=4) and stay hand-reviewable.

## Run all three

```powershell
# 1. TypeScript engine (ground truth)
cd packages/core ; bun test            # parity rows asserted in tests

# 2. Rust wasm crate
cargo test -p flow                     # fixture rows vs BPR parameterisation

# 3. Python agents service (service-shaped parity)
cd services/agents
uv run pytest tests/test_parity.py     # posts fixture rows against /assess
```

## Green criteria

- Row-for-row equality between TS and Rust within 1e-9 on travel time and
  stress.
- Python's `/assess` returns the risk band the fixture names (green/amber/
  orange/red) — bands are thresholds at 0.35/0.6/0.85, so exact match is
  expected.
- No row skips, no tolerance fudging: a failing row is a failing PR.

## When a row fails

1. Identify which constant changed: grep the ADR-0004 values
   (`46`, `60`, `4`, `2600`, `0.08`) across packages/core.
2. If intentional — update `fixture.json` in **both** homes plus docs
   constants, then both engines, in one PR (guide:
   `docs/guides/wasm-and-rust-parity.md`).
3. If accidental — revert; the failing engine is the one with the answer.

## Diffing a whole run (extended parity)

```powershell
bun run generate:check      # regenerates derived artefacts, verifies untouched
```

For engine-wide equivalence, run the same seed to a tick and compare
`stateHash` snapshots from TS and the Python service's `/assess` echo — the
8-hex fingerprint must match byte-for-byte (ADR 0009). Rust joins that
comparison via the crate's CLI dump once M3 lands.

## Tables for a parity report PR

Always include a 3-column table: row id, TS value, diff per engine. Reviewers
read diffs, not green ticks.
