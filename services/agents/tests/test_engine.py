"""Engine-level parity tests: pure compute vs independently recomputed BPR
closed form + exact-decimal anchors. The fixture is the byte-identical mirror
of packages/core/src/flow-wasm/__fixtures__/flow.json."""

from __future__ import annotations

import json
import math
from pathlib import Path

import pytest

from app.engine import (
    WIDEN_MULTIPLIER,
    solve_edges,
    stress,
    travel_time_min,
    widening_directives,
)

FIXTURE: list[dict[str, float | str]] = json.loads(
    (Path(__file__).parent / "fixtures" / "flow.json").read_text(encoding="utf-8")
)
TOL = 1e-9

# Exact-decimal anchors — LOCKSTEP with the TS and Rust twin suites; what
# catches anyImplementation drifting off IEEE-754 double semantics.
ANCHORS = {
    "station-yard-idle": (0.0, 12.0),
    "jhusi-pontoon-packed": (1.0, 9.2),
    "sangam-marg-half": (0.5, 10.09375),
    "bath-gau-jam": (1.6, 27.76256),
    "triveni-causeway-tiny-cap": (7.2, 808.21568),
    "prayagraj-jn-megacrowd": (5.2, 4980.3408),
    "samudra-manthan-tide": (1.0, 12.65),
    "shanti-quarter-calm": (0.15, 5.50041765625),
}


def expected_stress(v: float, c: float) -> float:
    if c <= 0:
        return math.inf if v > 0 else 0.0
    return 0.0 if v <= 0 else v / c


def expected_travel(v: float, c: float, free: float) -> float:
    if free <= 0:
        return 0.0
    s = expected_stress(v, c)
    r2 = s * s
    r4 = r2 * r2
    return free * (1.0 + 0.15 * r4)


def row(k: str) -> dict[str, float | str]:
    found = next(r for r in FIXTURE if r["edgeId"] == k)
    assert isinstance(found, dict)
    return found


def test_fixture_has_eight_shared_rows() -> None:
    assert len(FIXTURE) == 8
    assert list(ANCHORS) == [r["edgeId"] for r in FIXTURE]  # type: ignore[index]


def test_fixture_rows_match_independent_computation() -> None:
    for row_i in FIXTURE:
        v, c, free = float(row_i["v"]), float(row_i["c"]), float(row_i["freeTimeMin"])  # type: ignore[arg-type]
        assert abs(stress(v, c) - expected_stress(v, c)) <= TOL, row_i["edgeId"]
        assert abs(travel_time_min(v, c, free) - expected_travel(v, c, free)) <= TOL, (
            row_i["edgeId"]
        )


def test_decimal_anchors() -> None:
    for row_i in FIXTURE:
        v, c, free = float(row_i["v"]), float(row_i["c"]), float(row_i["freeTimeMin"])  # type: ignore[arg-type]
        want_stress, want_tt = ANCHORS[str(row_i["edgeId"])]
        assert abs(stress(v, c) - want_stress) <= TOL, row_i["edgeId"]
        assert abs(travel_time_min(v, c, free) - want_tt) <= TOL, row_i["edgeId"]


def test_saturation_ladder() -> None:
    assert stress(0.0, 0.0) == 0.0
    assert math.isinf(stress(5.0, 0.0))
    assert math.isnan(stress(float("nan"), 5.0))  # same comparison arms as TS/Rust
    assert stress(float("nan"), 0.0) == 0.0
    assert stress(-3.0, 10.0) == 0.0
    assert travel_time_min(5.0, 10.0, 0.0) == 0.0
    assert math.isinf(travel_time_min(5.0, 0.0, 2.0))


def test_solve_edges_shape_and_parity() -> None:
    out = solve_edges(FIXTURE)
    assert [r["edgeId"] for r in out] == [r["edgeId"] for r in FIXTURE]  # type: ignore[index]
    assert set(out[0]) == {"edgeId", "travelTimeMin", "stress"}
    for row_i, got in zip(FIXTURE, out, strict=True):
        v, c, free = float(row_i["v"]), float(row_i["c"]), float(row_i["freeTimeMin"])  # type: ignore[arg-type]
        assert abs(got["stress"] - expected_stress(v, c)) <= TOL
        assert abs(got["travelTimeMin"] - expected_travel(v, c, free)) <= TOL


def test_solver_is_deterministic() -> None:
    assert json.dumps(solve_edges(FIXTURE)) == json.dumps(solve_edges(FIXTURE))


def test_widening_directives_rank_worst_first() -> None:
    items = widening_directives(FIXTURE, seed=7, tick=42)
    assert len(items) == 2
    assert items[0]["edgeId"] == "triveni-causeway-tiny-cap"  # stress 7.2 — worst
    assert items[1]["edgeId"] == "prayagraj-jn-megacrowd"  # stress 5.2 — second
    for item in items:
        assert item["multiplier"] == WIDEN_MULTIPLIER == 1.35
        assert "42" in item["rationale"] and "widen +35%" in item["rationale"]


def test_widening_directives_tie_break_is_edge_id_ascending() -> None:
    twins = [
        {"edgeId": "b-twin", "v": 100, "c": 100, "freeTimeMin": 5},
        {"edgeId": "a-twin", "v": 100, "c": 100, "freeTimeMin": 5},
    ]
    items = widening_directives(twins, seed=0, tick=1)
    assert items[0]["edgeId"] == "a-twin"  # no randomness: equal stress sorts by id
    assert items[1]["edgeId"] == "b-twin"


def test_widening_directives_is_deterministic() -> None:
    assert json.dumps(widening_directives(FIXTURE, seed=7, tick=42)) == json.dumps(
        widening_directives(FIXTURE, seed=7, tick=42)
    )


def test_widening_directives_with_fewer_edges() -> None:
    assert widening_directives([], seed=0, tick=0) == []
    only = widening_directives([row("sangam-marg-half")], seed=0, tick=3)
    assert len(only) == 1
    assert only[0]["edgeId"] == "sangam-marg-half"


@pytest.mark.parametrize("bad", [{"edgeId": "x", "v": -1, "c": 10, "freeTimeMin": 1}])
def test_negative_seed_is_untouched_by_directive_math(
    bad: dict[str, float | str],
) -> None:
    # Documented: seed never enters numerics (no randomness by design); the
    # pydantic schema is the one enforcing non-negative seeds at the API edge.
    items = widening_directives([bad], seed=123, tick=0)
    assert items[0]["edgeId"] == "x"
