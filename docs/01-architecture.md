# Architecture

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Solid 2.0 (RC) | Fine-grained reactivity; no VDOM |
| Compiler | `@solidjs/vite-plugin` (Oxc-based) | Default in 2.0, zero config |
| Serving | Vite plugin **start mode**, client-only | Emits static `dist/client` |
| Routing | `@tanstack/solid-router` | File-based, type-safe search params |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) | Utility-first |
| UI primitives | Native HTML + Tailwind wrappers | See ADR-001 in docs/07 |
| Tests | Vitest + `@solidjs/testing-library` | |
| Hosting | Netlify (static) | See ADR-003 in docs/07 |

## Rendering model

Pure SPA. All domain math is synchronous and local, so there is no SSR or
server-function requirement in v1. `solid({ start: true })` without `ssr: true`
gives a streamed document shell in dev and a fully static build for Netlify
(`dist/client` + SPA fallback redirect).

## Directory layout

```text
src/
├── routes/
│   ├── __root.tsx          # Shell: header, unit/theme providers, Outlet
│   ├── index.tsx           # Calculator (primary route)
│   ├── compare.tsx         # Side-by-side setup comparison
│   ├── explore.tsx         # Chainring × cog heatmap
│   └── saved.tsx           # Saved setups manager
├── lib/
│   ├── gear/
│   │   ├── types.ts        # Domain types
│   │   ├── wheels.ts       # Wheel/tire size tables + diameter math
│   │   ├── calculations.ts # Pure functions: all derived metrics
│   │   ├── skid.ts         # Skid patch math + layout geometry
│   │   └── calculations.test.ts
│   ├── search.ts           # Shared calculator search schema + parsers
│   ├── state/
│   │   ├── setup-store.ts  # Current config, synced to URL search params
│   │   ├── saved-store.ts  # localStorage persistence
│   │   └── prefs-store.ts  # Units + theme
│   └── format.ts           # Number/unit formatting
├── components/
│   ├── calculator/         # Inputs, metric cards, cadence table
│   ├── skid/               # Radial skid patch SVG visualizer
│   ├── compare/            # Comparison table + delta highlighting
│   ├── explore/            # Heatmap grid
│   └── ui/                 # Native-element wrappers (slider, toggle, etc.)
├── router.tsx
└── styles.css
```

## State architecture

Three tiers, in order of authority:

1. **URL search params** — the active drivetrain configuration, present on
   **every** route. Validated and typed via TanStack Router `validateSearch`.
   Compare and Explore add optional extras (`c2`/`c3`/`c4`, `metric`/`minSkid`)
   on top of the same bike. Source of truth so every view is a shareable link.
2. **Solid stores** — app-level reactive state (prefs, saved setups) using
   Solid 2.0 draft-first stores.
3. **localStorage** — persistence for prefs and saved setups, hydrated on
   load.

Derived metrics are **never stored** — they are `createMemo` computations off
the config. This is the idiomatic Solid 2.0 model: minimal writable state,
everything else derived.

Units and theme are **not** in the URL. A shared link shows the bike; the
recipient sees it in their own unit/theme prefs.

## Data flow

```text
User input → navigate({ search, replace: true }) → validated search params
    → setup-store accessors → createMemo(derived metrics)
    → fine-grained DOM updates (only changed values re-render)
```

Copy-link copies `window.location.href` as-is, so Compare includes extra
columns and Explore includes the heatmap view state.

## Build & deploy

- `vite dev` — dev server (start mode owns entries; no `index.html` needed)
- `vite build` — static `dist/client`
- Netlify: build command `npm run build`, publish `dist/client`, SPA fallback
  via `netlify.toml` redirects. No router basepath; the site serves from `/`.
