# docs/

The documentation tree. One job per folder; cross-links over duplication.

| folder | contents |
|---|---|
| `adr/` | 10 numbered decision records (Governance, engine, formulas, format) |
| `api/` | reference for the three REST/SSE surfaces: web, agents, relay |
| `diagrams/` | 14 `.mmd` mermaid sources + embed index |
| `guides/` | 10 hands-on how-tos with commands |
| `runbooks/` | 6 operational runbooks (run, deploy, docker, sre, parity, data) |

## Where to start

- New contributor → `guides/local-dev.md`, then `guides/the-seed-and-determinism.md`.
- Engine questions → `adr/0001`, `adr/0004`, `diagrams/class-diagram.mmd`.
- Building an integration → `api/web-rest.md`, `api/agents-service.md`,
  `api/relay-sse.md`, and `packages/sdk`.
- Writing a scenario → `guides/write-own-scenario.md` (schema + zod).
- On-call/demo ops → `runbooks/sre.md`; deployments → `runbooks/deploy.md`.
- Vocabulary → `glossary.md` (Kumbh terms and engine nouns, one line each).

## Reading order for the ADRs

The ADRs read well in the numbered order — 0001 (the physics), 0002 (the app
shell), 0003 (the world), 0004 (the constants), 0005 (zero keys), 0006
(polyglot split), 0007 (tokens), 0008 (canvas), 0009 (snapshots), 0010
(linting) — each one's Alternatives section records the argument that lost.

## Word lint

No marketing vocabulary in these docs ("seamless", "revolutionize",
"cutting-edge" are banned terms); sources stay mermaid/JSON/code-first so
scripts can regenerate or embed without prose drift.
