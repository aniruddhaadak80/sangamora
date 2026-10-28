# services/relay

The pure-fan-out SSE hub (Go, port 7331). It computes nothing: `/publish`
ingests one event, the hub fans it out to every `/stream` subscriber on the
same seed topic, and `/healthz` reports liveness.

The wire contract lives in [`docs/api/relay-sse.md`](../../docs/api/relay-sse.md).

## Run

```sh
go run . --addr :7331
# or
RELAY_PORT=7331 go run .
```

## Test

```sh
go test ./...
go vet ./...
```

## Endpoints

| route | method | job |
|---|---|---|
| `/publish` | POST | accept one compacted JSON event (64 KiB cap), fan out |
| `/stream` | GET | subscribe as `text/event-stream`, filter with `?seed=` |
| `/healthz` | GET | `{"ok":true,"clients":N,"topics":M}` |

## Design notes

- **Replay, not state.** The hub keeps the last 1024 events per topic
  (`--history`). A reconnect with `Last-Event-ID` receives only the frames that
  arrived after that cursor, then continues live.
- **Monotonic ids.** Ids are the engine minute (`%08d`). A late or duplicate
  minute is bumped to `last+1` so a cursor never moves backwards.
- **Drop the slowest.** Each connection has a 128-frame buffer. A subscriber
  that fills it is closed and reconnects with a cursor; the publisher never
  blocks.
- **Boring plumbing.** Payloads are compacted and passed through unchanged.
