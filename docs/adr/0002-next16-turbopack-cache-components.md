# ADR 0002 — Next 16 + Turbopack + cacheComponents

Date: 2026-10-23
Status: Accepted

## Context

`apps/web` is one app with 11 routes: a heavy interactive map (`/map`), tables and
charts elsewhere, and thin REST adapters under `app/api/`. The app must boot fast,
build fast in CI, and keep TypeScript strict. Next 16 defaults to Turbopack for
`dev` and `build`, and its `cacheComponents` mode changes how async data and
fetching behave — that is the wanted direction, but only if committed to fully.

## Decision

Pin `next@16.4.2`, `react@19.3.1`, and run turbopack as the only bundler:

- `next.config.ts` sets `cacheComponents: true` and `partialPrefetching: true`.
  Dynamically-rendered reads go behind explicit Suspense boundaries; no implicit
  caching is relied upon anywhere.
- Tailwind v4 compiles through `@tailwindcss/turbopack` as a turbopack rule
  (`*.css` loader), so no separate CSS pipeline or PostCSS config exists.
- Workspace packages (`@sangamora/core`, `@sangamora/ui`, `@sangamora/seed`,
  `@sangamora/sdk`) ship TypeScript sources and enter the bundler via
  `transpilePackages` — no precompile step, no `main`/`types` drift.
- `typecheck` is `next typegen && tsc --noEmit`, so typed route helpers match the
  11 real routes.

## Consequences

- One bundler, one mental model; `next build` in CI is the same graph as `next dev`.
- `cacheComponents` means route code must state its data dependencies; the app
  keeps almost no server state anyway (the engine runs client-side), so the
  restriction costs little and pays back in hard guarantees.
- Tailwind via turbopack rule requires the rule to stay in `next.config.ts` when
  restructuring styles; removing it silently breaks CSS compilation.
- Engine determinism is untouched: no Next runtime sits between `CrowdSim` and
  the canvas.

## Alternatives considered

- **Webpack (Next 15 style)** — rejected: slower builds, two bundler code paths.
- **Vite + react-router remount** — rejected: loses the App Router adapters,
  which are the reference surface the docs (`docs/api/web-rest.md`) describe.
- **Astro for the static explainer pages** — rejected: a second framework for
  five informational routes buys nothing the explainer's client-side doctest
  deck would not.
