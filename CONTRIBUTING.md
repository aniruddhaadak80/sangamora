# Contributing to sangamora

Welcome! sangamora is a **deterministic, zero-API-key crowd simulation sandbox**
for the Kumbh Mela: one integer seed in (`MELA_SEED`), a 5-million-pilgrim
world out — identical every single time. Determinism is the product; so is
running anywhere with no keys, no cloud SDKs, no proprietary data.

Everything here is a simulation and a sandbox. It is **not affiliated with any
government body, Mela administration, or religious organization** — we model
crowd mathematics, not reality's policy.

## Setup

```bash
bun install --frozen-lockfile   # Bun 1.3.14 (packageManager pins it)
bun run dev                     # apps/web on http://localhost:3000
bun run test                    # vitest across the workspace
```

Optional polyglot bits (only when you touch them):

```bash
bunx playwright install --with-deps chromium && bun run e2e   # UI specs
cd crates/flow && cargo test          # Rust engine (wasm-parity)
pip install -r services/agents/requirements.txt && pytest services/agents
cd services/relay && go test ./...
```

## Folder map

| Path                | What lives here                                                  |
| ------------------- | ---------------------------------------------------------------- |
| `apps/web/`         | Next 16 + React 19 + Tailwind v4 sandbox UI (Turbopack default)   |
| `packages/core/`    | Deterministic crowd engine — the TypeScript source of truth       |
| `packages/ui/`      | Shared React components                                          |
| `packages/sdk/`     | Client SDK for driving the simulation                             |
| `packages/seed/`    | Deterministic fixtures / seeds                                    |
| `packages/config/`  | Shared tsconfig / eslint config                                   |
| `crates/flow/`      | Rust engine — byte-for-byte wasm-parity with `packages/core`      |
| `services/agents/`  | Python FastAPI crowd-marshal agent service (port 7332)            |
| `services/relay/`   | Go SSE daemon broadcasting live simulation ticks (port 7331)      |
| `scripts/`          | Asset/scenario generators + the 1M-LoC counter (`loc-count.mjs`)  |
| `docs/`             | `adr/` decisions · `api/` · `diagrams/` · `guides/` · `runbooks/` |
| `examples/`         | Runnable usage examples                                           |

## Code style

- **TypeScript strict mode**, ESM; `verbatimModuleSyntax` — use
  `import type` for types. **No `any`.**
- Files are **kebab-case** (`crowd-pressures.ts`, not `CrowdPressures.ts`).
- **Comments explain why**, not what — if a code block needs a what-comment,
  the code probably needs a rename instead.
- Engine math stays pure and dependency-free: same seed in → same world out,
  in TS and in Rust. If `packages/core` and `crates/flow` disagree, that's a
  bug — parity fixtures exist to prove it.
- Never commit secrets or tokens; config only ever reads `{env:...}` /
  `{file:...}` substitutions.

## Commits & PRs

- **Conventional Commits**, enforced on PR titles:
  `feat:` · `fix:` · `docs:` · `chore:` · `test:` (also fine: `refactor:`,
  `perf:`, `build:`, `ci:`). Scope optional: `feat(agents): …`
- Commit **sign-off is not required**.
- One logical change per commit; small PRs beat heroic PRs.

Flow:

```bash
# fork → branch → commit → push → open the PR
gh repo fork --clone          # or add your fork as a remote
git switch -c feat/panic-points
git commit -s -m "feat(core): add panic-point propagation to crowd model"
gh pr create --fill
```

CI (`.github/workflows/ci.yml`) runs typecheck, lint, unit tests and Playwright
e2e on every PR; `polyglot.yml` runs the Rust/Python/Go gates when relevant.

## Test policy

- Every bug fix ships with the **regression test** that reproduces it first.
- Engine-math changes need **parity fixtures** on both sides:
  `packages/core` (vitest) and `crates/flow` (cargo test) must agree.
- UI behavior that a user can trigger gets a Playwright spec in `apps/web`.
- New generators (see `scripts/generators/`) must be idempotent — verify with
  `bun run generate:check`.

## Good first issues

Look for the [`good first issue`](https://github.com/aniruddhaadak80/sangamora/labels) label. Recurring greenfield areas:

- **Crowd math** — flow-rate, panic propagation, density pressure modeling in
  `packages/core` + wasm parity in `crates/flow`.
- **Visualization** — canvas/WebGL overlays, heatmap layers, sector browsers
  in `apps/web` + `packages/ui`.
- **i18n locales** — adding locale packs (Hindi, Marathi, Tamil, …) so the
  sandbox reads natively for pilgrims and marshals.

## Docs & roadmap

- Docs index: [`docs/README.md`](docs/README.md)
- Decisions: `docs/adr/` — read the relevant ADR before proposing something
  the project may have deliberately decided already.
- Project direction / roadmap: see [README.md](README.md) plus the labels on
  the issue tracker.

## Housekeeping

- Huge generated files land via the scale engine (`scripts/generators/`), not
  by hand — ask an ADR first.
- CI includes an **advisory 1,000,000-line floor** check
  (`scripts/loc-count.mjs --min-lines 1000000`) that becomes a hard gate once
  the wave-3 scale engine finishes.
