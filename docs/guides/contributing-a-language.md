# Contributing a language

Sangamora's i18n is deliberately homegrown: a `LocaleContext` with 14 locale
catalogs, no `next-intl`, no ICU parser, no route re-write middleware. This
guide is the decision record and the how-to.

## Why homegrown rather than next-intl

The user interface has three scattered string homes (App Router pages, canvas
overlays, palette items) and ~200 strings. `next-intl` buys route-localized
loading and format plugins — capabilities an offline simulation canvas never
exercises — while costing middleware, message packing and a lingua-artifacts
file. Plain React context and a flat catalog solve the actual problem with
zero runtime and zero build step:

- `LocaleContext` resolves once on the client (cookie first, then
  `localStorage`), and a `<LocaleSwitcher>` primitive sets both.
- Deterministic, since the catalog is bundled: the sim's UI never
  asynchronously swaps strings mid-render.

## The catalog shape

```ts
// packages/i18n/locales/hi.ts
export const hi = {
  "map.title": "कुंभ प्रवाह — /map",
  "risk.band.red": "संकट",
  "palette.applyScenario": "परिदृश्य लागू करें…",
  // <= 200 flat keys; dot-namespaced placeholders stay verbatim
} as const;
```

Rules: one namespace per route prefix (`map.`, `risk.`, `replay.…`),
interpolation as `{count}` substituted at render, never parsed; sector and
`hotspotName` strings already ship bilingual (`nameHi` on `SECTORS`).

## Adding a language

1. Copy `locales/en.ts` to `locales/kn.ts`; keep every key — missing keys
   fall back to English *and* print one console warning per page load.
2. Register the locale in `packages/i18n/index.ts` (`bcp47` tag, RTL flag,
   catalog import).
3. Run `bun test -w packages/i18n` — the parity test diffs key sets across
   the 14 catalogs; it fails if `kn` misses keys or invents new ones.
4. Type-check: catalogs are `satisfies Catalog` so keys are compiler-checked.

## Conventions

- First word-casing follows the locale's own convention, not English Title.
- Numerals: engine numbers stay `en-IN` formatted; tens of thousands use
  Indian digit grouping via `formatIndian` from `packages/core`.
- PR checklist: `feat(i18n): add Kannada catalog (kn)` + parity test green +
  screenshots of `/explainer` in the new locale.

Deep rationale lives in the guide decision block above; a standalone ADR is
slated for the next docs wave once the M1 i18n milestone lands.
