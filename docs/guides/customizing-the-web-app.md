# Customising the web app — theme tokens, props, and where things live

`apps/web` is mostly composition: 11 App Router routes, a canvas, a palette,
and `packages/ui` primitives doing the painting. You customise by editing
tokens, not component CSS.

## The three levers

1. **Colour tokens (CSS-first Tailwind v4).** `apps/web/src/app/globals.css`
   declares the sangamora palette once in `@theme`:

   ```css
   @theme {
     --color-saffron: #FF8A00;   /* primary crowd-warm accent */
     --color-ink: #241203;       /* text */
     --color-surface: #FFF6EC;   /* canvas bg */
     --color-band-green: #356a45;
     --color-band-amber: #c97e12;
     --color-band-orange: #d95e11;
     --color-band-red: #a82217;
   }
   ```

   Primitives in `packages/ui` never hard-code hex; they read these names
   (the consumer theme contract, ADR 0007). Change tokens, the whole app re-tints.

2. **Component props over class sprawl.** Semantic variants are props —
   `tone="amber"`, `dense`, `size="lg"` — so a card restyle is one place.
   Layout-only composition via `className` is allowed; paint overrides are
   not (review calls those out).

3. **Density and spacing** follow the same token families
   (`--spacing-*`, radii) — a "compact mode" stays a token flip.

## The edge-band mapping

Risk colours on the `/map` canvas, `/risk` board and recharts surfaces come
from the band tokens above; `RISK_BANDS` thresholds (0.35/0.6/0.85) live in
the engine, display lives here. Do not re-derive thresholds in UI code.

## The canvas

`/map` is a 2D `<canvas>` (ADR 0008): brush pass draws sector discs and edge
ribbons, then `sampleAgents()` particles. Colour mapping reads the same
tokens; to re-shape the drawing itself you edit the canvas module, not CSS.

## Checklist for a restyle PR

1. Tokens changed? Run `bun run dev`, walk all 11 routes.
2. `bun run typecheck && bun run lint` — `eslint-config-next` strict.
3. Prefer a prop rename in `packages/ui` over a one-off override in the app;
   40+ primitives share these contracts.
4. Screenshots in the PR description (Playwright e2e can capture `/map`,
   `/risk`, `/bazaar` quickly).

Conventional commit: `feat(ui): night-mode surface token to #fff8ec`.
