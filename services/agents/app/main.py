"""Crowd-marshal FastAPI service — the deterministic Python head of the
sangamora sandbox. Zero API keys, zero network at rest; the only I/O is the
HTTP request body the caller supplies.

Endpoints:
  GET  /healthz    -> {ok: true}
  POST /risk       -> BPR actuation over edge rows (pure stdlib math)
  POST /directive  -> simplified MarshalBrain: rank by stress, widen top-2

Errors use a stable envelope {ok: false, error: {code, message}} so the TS
SDK (packages/sdk) can map them onto SdkError cleanly. FastAPI's generated
/openapi.json exists only at RUNTIME — nothing is committed for it.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.engine import solve_edges, widening_directives
from app.schemas import (
    DirectiveRequest,
    DirectiveResponse,
    HealthResponse,
    RiskRequest,
    RiskResponse,
)

app = FastAPI(
    title="Sangamora Agents — Crowd Marshal Service",
    version="1.0.0",
    description="Deterministic BPR edge-flow + marshal directives. No keys, no network, no randomness.",
)


# -- error envelope ----------------------------------------------------------
# One shared shape for validation (422) and transport/domain errors so SDK
# error mapping never forks per-endpoint.


def error_body(code: str, message: str) -> dict[str, Any]:
    return {"ok": False, "error": {"code": code, "message": message}}


def first_issue(exc: RequestValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "invalid request body"
    first = errors[0]
    loc = ".".join(str(part) for part in first.get("loc", []))
    return f"{loc}: {first.get('msg', 'invalid')}"


@app.exception_handler(RequestValidationError)
async def validation_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Pydantic rejections become the documented envelope (not raw FastAPI detail lists)."""
    return JSONResponse(
        status_code=422, content=error_body("validation", first_issue(exc))
    )


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code, content=error_body("http", str(exc.detail))
    )


# -- endpoints ---------------------------------------------------------------


@app.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    return HealthResponse(ok=True)


@app.post("/risk", response_model=RiskResponse)
def risk(req: RiskRequest) -> RiskResponse:
    """Actuate each edge row with the BPR closed form; row order is preserved."""
    results = solve_edges([row.model_dump() for row in req.edges])
    return RiskResponse.model_validate(
        {"results": results, "engine": "python-deterministic"}
    )


@app.post("/directive", response_model=DirectiveResponse)
def directive(req: DirectiveRequest) -> DirectiveResponse:
    """Deterministic marshal plan: the two most-stressed edges get widened.

    Same BPR engine as /risk; ranking is a pure function of
    (stress desc, edgeId asc). Identical requests -> identical bodies (proven
    in tests).
    """
    items = widening_directives(
        [row.model_dump() for row in req.edges], seed=req.seed, tick=req.tick
    )
    return DirectiveResponse(
        seed=req.seed,
        tick=req.tick,
        strategy="widen-worst-2",
        directives=items,  # pydantic coerces the plain dicts into DirectiveItem
    )
