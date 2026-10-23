# Relay SSE API (services/relay, Go, :7331)

The pure-fan-out broadcaster. Nothing computes here: `/publish` ingests an
event, the hub fans it to every connected `/stream` subscriber per topic.
SSE text/event-stream, UTF-8, single-line JSON `data:`.

## Endpoints

| route | method | job |
|---|---|---|
| `/publish` | POST | accept one event, fan out |
| `/stream` | GET | subscribe (SSE, per-topic filter) |
| `/healthz` | GET | `{ok, clients, topics}` |

## Event format

```
event: state
id: 00004315
data: {"type":"state","seed":7,"minute":4315,"stateHash":"9f2c71bd","gotSnan":12210}

```

Rules:

- `id` is the engine minute (monotonic within a topic) — clients reconnect
  with `Last-Event-ID` and resume without gaps.
- `data` is one line of JSON; publish payload caps at 64 KiB (snapshot v1
  bounded). Oversize publishes get `413` and no fan-out.
- Topic = `seed` by convention: `?seed=7` on both routes.

## Publish

```powershell
curl -X POST http://localhost:7331/publish `
  -H "content-type: application/json" `
  -d '{"type":"state","seed":7,"minute":4315,"stateHash":"9f2c71bd","gotSnan":12210}'
```

Response: `{"published": 1, "fanout": 3}` (subscribers reached).

## Stream

```powershell
curl -N "http://localhost:7331/stream?seed=7"
```

First frames: `retry: 1000`, then a `hello` event echoing the topic, then
published events. Heartbeats every 15s as `: ping` comment lines — the relay
keeps-alive through the SSE comment channel so frames stay pure.

Reconnect with a cursor:

```powershell
curl -N -H "Last-Event-ID: 00004200" "http://localhost:7331/stream?seed=7"
```

## Publish rate and backpressure

- `--publish-rate 1s` default advisory; bursts are fine, sustained bursts
  queue per-connection with a 128-frame buffer. A full buffer drops the
  slowest subscriber (closed + reconnect), never back-pressures the publisher.
- No auth (zero-keys principle); bind to internal network or compose-local.

## Who publishes what

- `apps/web` `/api/directive` publishes each committed tick (state event).
- `services/agents` publishes directive events after `/marshal` (event type
  `directive`, payload = the patch).
- e2e tests publish synthetic events against a seed=0 scratch topic.

The relay never mutates payloads — it is plumbing, and being boring is its
entire design budget: see ADR 0006.
