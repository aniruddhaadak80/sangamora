# Runbook — SRE: health, logs, ports, graceful shutdown

What an operator needs at 03:00 when the demo is being watched.

## Port map

| port | process | purpose |
|---|---|---|
| 3000 | apps/web (Next 16) | UI, REST adapters |
| 7331 | services/relay (Go) | SSE hub `/publish`, `/stream` |
| 7332 | services/agents (Python FastAPI) | marshal scoring, `packages/sdk` |

## Health endpoints

```powershell
curl http://localhost:3000/api/healthz    # web: engine boot, seed, uptime
curl http://localhost:7331/healthz        # relay: connections, published-echo
curl http://localhost:7332/healthz        # agents: fixture self-test result
```

All three answer `{"ok":true,...}` in under 50 ms locally. `/api/healthz` also
echoes `MELA_SEED`, so a misconfigured deploy shows its numbers immediately.

## Logs

- **web**: structured (Next instrumentation); the engine itself logs nothing
  per tick — watch the REST adapters and Playwright traces.
- **agents**: uvicorn access log; every `/assess` and `/directive` call logs
  `seed`, `tick`, and a score-band summary (no payloads).
- **relay**: single-line JSON: `event`, `clients`, `topics`.

Filter relay stress by connection count:
`docker compose logs -f relay | findstr "clients"` (Windows) or `grep clients`.

## Graceful shutdown

- **web** (Vercel/VM): normal SIGTERM redeploy; the engine is in-process and
  stateless — connections drain, nothing to flush.
- **relay**: handles SIGTERM, broadcasts a final `event: shutdown` then closes
  streams; `--drain-ms 5000` caps the wait.
- **agents**: uvicorn `--timeout-graceful-shutdown 10`; in-flight scoring
  finishes, new requests get 503. Deterministic scoring means a replayed
  request is an acceptable recovery path.

## Failure triage

| symptom | first check |
|---|---|
| `/stream` heartbeats stop | relay `/healthz` `clients` counter stuck → recycle relay; clients reconnect with `Last-Event-ID` |
| `/api/directive` 500 | unknown id in patch — engine throws by design; validator on the caller side |
| agents 7332 slow | `pytest tests/parity` locally: a fixture change without code change can wedge scoring |
| snapshot hash mismatches | rebuild web; the hash generation is build-stable, so differ = different bundle |

## Escalation

No pager exists — this is an offline sandbox. If a demo breaks: redeploy
(determinism guarantees reproducibility), and tag the buggy commit for the
next parity-fixture PR.
