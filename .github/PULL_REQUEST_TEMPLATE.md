## What?

<!-- One or two sentences describing the change. Keep PRs small and single-purpose. -->

## Why?

<!-- Motivation, context, and the issue it closes: Fixes #123 -->

## How tested?

- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run test` passes
- [ ] `bun run e2e` passes (UI-affecting changes)
- [ ] Polyglot gates pass where touched — `cargo test` (crates/flow) · `pytest services/agents` · `go test ./...` (services/relay)
- [ ] Deterministic outputs verified: same `MELA_SEED` in → same world out (no snapshot drift resigned away)

Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, …) and the PR title matches the same grammar.

## Screenshots

<!-- Required if UI changed (before/after). N/A otherwise. -->

## Diagram

<!-- Required if the change is architectural — a Mermaid block or an image
     under docs/diagrams/. N/A otherwise. -->
