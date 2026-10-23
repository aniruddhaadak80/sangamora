# ADR 0007 — Tailwind v4: tokens, not CSS classes, through a consumer theme contract

Date: 2026-10-23
Status: Accepted

## Context

`packages/ui` ships 40+ primitives used by `apps/web` (and, whenever they build
any surface, the relay's tiny status pages). With Tailwind v4, CSS-first
configuration has replaced `tailwind.config.js`; that opens one big fork:
whether each component hard-codes utility strings, or reads from a token
system its *consumer* — the app — owns. Hard-coded strings look fast today and
cost yesterday's paint on day two.

## Decision

Primitives in `packages/ui` consume **theme tokens**, declared in each consumer
with Tailwind v4's `@theme` directive:

- Components never carry raw hex values or shadow stacks. They emit utility
  classes referencing token names (`bg-surface`, `text-ink`, `border-line`,
  radii and spacing tokens) that resolve from the consumer's `@theme`.
- `apps/web` defines the sangamora palette (saffron-primary `#FF8A00` family,
  ink text, calm neutrals) once in CSS; every primitive inherits.
- The contract is two tokens families: `--color-*` for surfaces/ink, and
  component props for semantic variants (tone, size, density) — a third escape
  hatch (`className`) is allowed for layout-only composition, never paint.
- Swap animation curves and easing as tokens too, so the canvas and the DOM
  agree on motion.

## Consequences

- Re-theming the mela (or shipping an editor dark mode) is a CSS edit in the
  consumer; `packages/ui` does not release.
- A reviewer rule rather than a linter keeps raw colours out of components;
  escape hatches exist but each use is called out in review.
- New contributors must internalise the "token-first" habit; the guide
  (`docs/guides/customizing-the-web-app.md`) carries the working examples.

## Alternatives considered

- **Self-styled components (shadcn-style, code owned by consumer)** — rejected:
  with 40+ primitives the token debt would accumulate in every app.
- **CSS-in-JS (vanilla-extract, panda)** — rejected: build cost and runtime
  trade-offs for a problem Tailwind v4 `@theme` already solves statically.
- **Design tokens via style-dictionary JSON** — rejected: a codegen step for
  one consumer is ceremony without a consumer-2 to earn its keep.
