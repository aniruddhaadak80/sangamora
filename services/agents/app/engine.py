"""Pure BPR actuator kernel — the Python twin of
`packages/core/src/flow-wasm/engine.ts` (TS) and `crates/flow/src/lib.rs`
(Rust). stdlib only, deterministic, no randomness, no network.

Parity contract (full version in packages/core/src/flow-wasm/README.md):
  stress        = v / c
  travel_time_min = free_time_min * (1 + 0.15 * (v/c)^4)
The beta=4 exponent is realized as two squared multiplies — IEEE 754 does not
guarantee cross-language identical rounding for `pow`, only for + - * /.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any

# Standard BPR exponents — same constants as the TS/Rust twins.
STRESS_ALPHA = 0.15
STRESS_BETA = 4

# Simplified MarshalBrain: widening an edge raises (not lowers) capacity by
# 35%, i.e. multiplier = 1.0 + 0.35. Kept as an explicit constant so tests can
# pin it like the decimal anchors.
WIDEN_MULTIPLIER = 1.35


def stress(v: float, c: float) -> float:
    """stress = v/c with the saturation ladder mirrored from TS/Rust exactly:

    c <= 0 -> +inf when v > 0 else 0.0; v <= 0 -> 0.0. NaN comparisons are all
    false in Python exactly like in TS/Rust, so NaN v in -> NaN out (c > 0)
    and -> 0.0 (c <= 0): identical ladder behaviour in every twin, no panics.
    """
    if c <= 0.0:
        return float("inf") if v > 0.0 else 0.0
    return 0.0 if v <= 0.0 else v / c


def travel_time_min(v: float, c: float, free_time_min: float) -> float:
    """travel_time_min = free_time_min * (1 + STRESS_ALPHA * r4)

    with r4 = (s*s)*(s*s) — the two-squares realization of the beta=4 BPR
    exponent. free_time_min <= 0 -> 0.0 (mirrored saturation arm).
    """
    if free_time_min <= 0.0:
        return 0.0
    s = stress(v, c)
    r2 = s * s
    r4 = r2 * r2
    return free_time_min * (1.0 + STRESS_ALPHA * r4)


def solve_edges(rows: Iterable[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """BPR-actuate already-validated row dicts (camelCase wire names).

    Returns [{edgeId, travelTimeMin, stress}, ...] in the caller's row order —
    the payload of POST /risk.
    """
    results: list[dict[str, Any]] = []
    for row in rows:
        v = float(row["v"])
        c = float(row["c"])
        results.append(
            {
                "edgeId": str(row["edgeId"]),
                "travelTimeMin": travel_time_min(v, c, float(row["freeTimeMin"])),
                "stress": stress(v, c),
            }
        )
    return results


def widening_directives(
    rows: Iterable[Mapping[str, Any]], *, seed: int, tick: int
) -> list[dict[str, Any]]:
    """Simplified MarshalBrain (deterministic, zero randomness by design):

    1. score each edge with the SAME BPR stress as /risk (see parity README),
    2. rank by stress descending, tie-break edgeId ascending (fully
       deterministic without any hash/seeding tricks),
    3. widen the top 2 with `WIDEN_MULTIPLIER` and emit rationale strings.

    `seed` is validated + echoed but deliberately does NOT enter the numerics:
    the sandbox's only stochastic ingesters live TS-side. Two identical calls
    (same seed/tick/edges) therefore return byte-identical bodies, which the
    API test proves.
    """
    scored = [
        (str(row["edgeId"]), stress(float(row["v"]), float(row["c"]))) for row in rows
    ]
    ranked = sorted(scored, key=lambda item: (-item[1], item[0]))
    total = len(ranked)
    directives: list[dict[str, Any]] = []
    for rank, (edge_id, the_stress) in enumerate(ranked[:2], start=1):
        directives.append(
            {
                "edgeId": edge_id,
                "multiplier": WIDEN_MULTIPLIER,
                "rationale": (
                    f"rank {rank}/{total} - stress {the_stress:.2f} vs free flow at tick {tick}; widen +35%"
                ),
            }
        )
    return directives
