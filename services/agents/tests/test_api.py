"""API-level tests with the httpx TestClient: healthz, /risk vs the shared
mirror fixture, /directive determinism (identical calls -> byte-identical
bodies), and the stable error envelope on bad input."""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from app.main import app

CLIENT = TestClient(app)
FIXTURE: list[dict[str, Any]] = json.loads(
    (Path(__file__).parent / "fixtures" / "flow.json").read_text(encoding="utf-8")
)
TOL = 1e-9


def expected_travel(v: float, c: float, free: float) -> float:
    if free <= 0:
        return 0.0
    s = 0.0 if v <= 0 else v / c
    r2 = s * s
    r4 = r2 * r2
    return free * (1.0 + 0.15 * r4)


def test_healthz_is_ok() -> None:
    res = CLIENT.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"ok": True}


def test_risk_fixture_rows_parity() -> None:
    res = CLIENT.post("/risk", json={"edges": FIXTURE})
    assert res.status_code == 200
    body = res.json()
    assert body["engine"] == "python-deterministic"
    assert [r["edgeId"] for r in body["results"]] == [r["edgeId"] for r in FIXTURE]
    for row_i, got in zip(FIXTURE, body["results"], strict=True):
        want = expected_travel(
            float(row_i["v"]), float(row_i["c"]), float(row_i["freeTimeMin"])
        )
        assert math.isclose(got["travelTimeMin"], want, abs_tol=TOL)
        assert set(got) == {"edgeId", "travelTimeMin", "stress"}


def test_risk_empty_edges_is_valid() -> None:
    res = CLIENT.post("/risk", json={"edges": []})
    assert res.status_code == 200
    assert res.json() == {"results": [], "engine": "python-deterministic"}


def test_directive_is_deterministic_byte_for_byte() -> None:
    payload: dict[str, Any] = {"seed": 7, "tick": 42, "edges": FIXTURE}
    first = CLIENT.post("/directive", json=payload)
    second = CLIENT.post("/directive", json=payload)
    assert first.status_code == second.status_code == 200
    assert json.dumps(first.json(), sort_keys=True) == json.dumps(
        second.json(), sort_keys=True
    )


def test_directive_shapes_and_ranking() -> None:
    body = CLIENT.post(
        "/directive", json={"seed": 19, "tick": 420, "edges": FIXTURE}
    ).json()
    assert body["strategy"] == "widen-worst-2"
    assert body["engine"] == "python-deterministic"
    assert body["seed"] == 19 and body["tick"] == 420
    assert [d["edgeId"] for d in body["directives"]] == [
        "triveni-causeway-tiny-cap",  # stress 7.2
        "prayagraj-jn-megacrowd",  # stress 5.2
    ]
    for item in body["directives"]:
        assert item["multiplier"] == 1.35
        assert "widen +35%" in item["rationale"] and "420" in item["rationale"]


def test_error_envelope_on_bad_input() -> None:
    bad_cases: list[tuple[str, str, str]] = [
        # (label, path, raw JSON body)
        ("missing edgeId", "/risk", '{"edges": [{"v": 1, "c": 2, "freeTimeMin": 3}]}'),
        (
            "negative v",
            "/risk",
            '{"edges": [{"edgeId": "x", "v": -1, "c": 2, "freeTimeMin": 3}]}',
        ),
        (
            "zero-ish c",
            "/risk",
            '{"edges": [{"edgeId": "x", "v": 1, "c": 0.0, "freeTimeMin": 3}]}',
        ),
        # Raw body (not json=) so a nonfinite literal can even reach the server;
        # pydantic's allow_inf_nan=False must reject it into the stable envelope.
        (
            "nonfinite v",
            "/risk",
            '{"edges": [{"edgeId": "x", "v": Infinity, "c": 2, "freeTimeMin": 3}]}',
        ),
        (
            "extra field",
            "/risk",
            '{"edges": [{"edgeId": "x", "v": 1, "c": 2, "freeTimeMin": 3, "nope": 1}]}',
        ),
        ("missing edges", "/risk", "{}"),
        ("bad tick", "/directive", '{"seed": 1, "tick": -2, "edges": []}'),
        ("negative seed", "/directive", '{"seed": -1, "tick": 0, "edges": []}'),
    ]
    for case, path, raw_body in bad_cases:
        res = CLIENT.post(
            path,
            content=raw_body,
            headers={"content-type": "application/json"},
        )
        assert res.status_code == 422, f"{case}: expected 422, got {res.status_code}"
        envelope = res.json()
        assert envelope["ok"] is False, case
        assert envelope["error"]["code"] == "validation", case
        assert (
            isinstance(envelope["error"]["message"], str)
            and envelope["error"]["message"]
        ), case


def test_openapi_is_runtime_only_but_generateable() -> None:
    # FastAPI materializes openapi.json at runtime; the repo commits nothing
    # generated. The SDK's optional contract loader tolerates its absence.
    res = CLIENT.get("/openapi.json")
    assert res.status_code == 200
    assert {"/healthz", "/risk", "/directive"} <= set(res.json()["paths"])
