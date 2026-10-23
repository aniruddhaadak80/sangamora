# ADR 0010 — Linting discipline: strict flat ESLint config, no eslint-disable carpet

Date: 2026-10-23
Status: Accepted

## Context

The repo carries TypeScript strictness further than most:
`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`
(`packages/config/tsconfig.base.json`), plus a determinism rule with real teeth:
no `Math.random`, no `Date.now` anywhere in engine code. Weak linting would let
these guarantees rot within weeks. Equally, a wall of per-line `eslint-disable`
comments makes the linter decorative rather than protective.

## Decision

One flat config, strict, per workspace, aligned with `eslint-config-next@16`:

```js
// eslint.config.mjs (apps/web, packages/*)
import next from "eslint-config-next";
export default [next(strict), { /* repo rules */ }];
```

- **`no-restricted-globals`** bans `Math.random` and `Date.now` in
  `packages/core/src/**` and `crates/**` ports — the compiler enforces what
  review might miss.
- **No comment-based disables**: `eslint-disable-next-line` is not part of the
  vocabulary. When a rule is legitimately wrong *for this repo*, the rule
  itself is changed in config with a one-line rationale comment in the config
  file — visible in one place to everyone, not scattered in sources.
- `tsc --noEmit` runs as part of `turbo typecheck` before `turbo test`; lint
  failures are release-blockers equal to test failures.
- Formatting stays in Prettier-adjacent `.editorconfig` territory: this ADR
  only fixes *linting*, not style churn.

## Consequences

- New rules arrive in one file; the blame for a repo-wide style choice is
  always findable and changeable.
- The occasional rule-conflict PR (usually with `react-hooks` on generated
  canvas code) is resolved by *sharpening the rule*, not muting it — an
  overhead we accept deliberately.
- CI lint time stays a few seconds; the lint job does not become the slow
  queue everything waits behind, because flat configs cache cleanly.

## Alternatives considered

- **Per-line `eslint-disable` with review approval** — rejected: the disable
  carpet grows monotonically; the config file is the honest ledger.
- **Biome as a full lint/format replacement** — rejected: attractive and
  single-binary, but `eslint-config-next` ships rule sets the Next surfaces
  actually want; revisit if Next ever stops shipping it.
- **No lint, strict types only** — rejected: the determinism and a11y rules
  are exactly the ones the type system cannot express.
