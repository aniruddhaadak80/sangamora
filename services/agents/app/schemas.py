"""Wire models (pydantic v2). Field names ARE camelCase on purpose: they are
byte-equal with the TS mirror in `packages/sdk/src/types.ts`, which is the
contract the SDK class relies on. Bounds mirror the TS zod schemas exactly
(they keep the BPR closed form inside f64 and inside valid JSON — worst case
v=1e12 with c=1e-6 gives s^4 ≈ 1e72 → tt ≈ 1.15e72, far below float max, so no
Infinity ever serializes).
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class EdgeRow(BaseModel):
    """One edge-flow observation — same shape as `__fixtures__/flow.json`."""

    # WHY extra="forbid": a typo'd field would be silently dropped otherwise,
    # and dropped BPR inputs would "compute" garbage quietly.
    model_config = ConfigDict(extra="forbid")

    edgeId: str = Field(min_length=1, max_length=64)
    # Flow, people/min. >=0 and <= 1e12 puts every closed form inside f64.
    v: float = Field(ge=0.0, le=1e12, allow_inf_nan=False)
    # Capacity, people/min; strictly positive floor keeps stress finite-ish
    # and away from zero-division semantics (see module docstring).
    c: float = Field(ge=1e-6, le=1e12, allow_inf_nan=False)
    # Minutes to cross at calm; 0 is a valid "actuator skips this edge" row.
    freeTimeMin: float = Field(ge=0.0, le=1e9, allow_inf_nan=False)


class RiskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    edges: list[EdgeRow]


class RiskResult(BaseModel):
    edgeId: str
    travelTimeMin: float
    stress: float


class RiskResponse(BaseModel):
    results: list[RiskResult]
    engine: str = "python-deterministic"


class DirectiveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # WHY uint bounds: JS-safe integer for the SDK mirror (2^53-1) and a sane
    # tick ceiling matching the core sim's range.
    seed: int = Field(ge=0, le=2**53 - 1)
    tick: int = Field(ge=0, le=10_000_000)
    edges: list[EdgeRow]


class DirectiveItem(BaseModel):
    edgeId: str
    # Capacity multiplier COMPOSES multiplicatively in the core sim (clamp
    # [0.05, 2.5]); 1.35 widening is inside the clamp.
    multiplier: float
    rationale: str


class DirectiveResponse(BaseModel):
    seed: int
    tick: int
    strategy: str
    directives: list[DirectiveItem]
    engine: str = "python-deterministic"


class HealthResponse(BaseModel):
    ok: Literal[True]
