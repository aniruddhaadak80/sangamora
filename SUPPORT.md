# Support

Welcome to sangamora support. Three doors, pick your speed:

| Need                        | Door                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Usage questions / help      | [Discussions → Q&A](https://github.com/aniruddhaadak80/sangamora/discussions/categories/q-a) — ask anything   |
| Ideas, tuning debates       | [Discussions → Ideas](https://github.com/aniruddhaadak80/sangamora/discussions)                                |
| Something is clearly broken | [Bug issue template](https://github.com/aniruddhaadak80/sangamora/issues/new/choose)                            |
| Security-sensitive          | [SECURITY.md](SECURITY.md) — private advisory only, never a public issue                                       |

## Docs map

All documentation lives under [`docs/`](docs/README.md):

| Path               | Contents                                                                 |
| ------------------ | ------------------------------------------------------------------------ |
| [`docs/README.md`](docs/README.md) | Docs index — start here                                  |
| `docs/adr/`        | Architecture decision records (why the engine is built the way it is)     |
| `docs/api/`        | Engine / SDK / service API reference                                      |
| `docs/diagrams/`   | Mermaid diagrams of the architecture and data flow                        |
| `docs/guides/`     | Task-first how-tos (writing a scenario, adding a locale, extending viz)    |
| `docs/runbooks/`   | Operational runbooks (self-hosting on Docker / Fly / Render / Vercel)     |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Setup, style, commit and PR conventions                 |

## Quickstart (one line)

```bash
bun install --frozen-lockfile && bun run dev
```

Then open <http://localhost:3000> — a deterministic 5M-pilgrim world, seeded
by `MELA_SEED`, entirely offline, zero API keys required.

## Disclaimer

sangamora is a **simulation sandbox**. It is not affiliated with, does not
represent, and takes no guidance from any government authority, Mela
administration, disaster-response agency, or religious organization. Crowd
figures are synthetic and deterministic — useful for studying flow, pressure
and panic math, nothing more.
