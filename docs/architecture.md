# Architecture

How Fixie Gears is put together. Domain math:
[domain](domain.md). URL and stores:
[state and routing](state-and-routing.md). Decisions:
[ADRs](decisions.md).

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Solid 2.0 (RC) | Fine-grained reactivity; no VDOM |
| Compiler | `@solidjs/vite-plugin` | Oxc-based, `solid({ start: true })` |
| Serving | Vite start mode, client-only | Emits static `dist/client` |
| Routing | `@tanstack/solid-router` | File-based, typed search params |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) | Utility-first |
| UI primitives | Native HTML + Tailwind wrappers | ADR-001 in [decisions](decisions.md) |
| Tests | Vitest + `@solidjs/testing-library` | Next to the source they cover |
| Hosting | Netlify (static) | ADR-003 in [decisions](decisions.md) |
| PWA | `vite-plugin-pwa` (Workbox `generateSW`) | App-shell offline after first visit |

## Rendering

Pure SPA. All domain math is synchronous and local, so there is no SSR.
`solid({ start: true })` without `ssr: true` gives a streamed document
shell in dev and a fully static build for Netlify (`dist/client` plus
the SPA fallback in `netlify.toml`). Do not set a router basepath; the
site serves from `/`.

## Directory layout

```text
public/                 # copied to dist/client; served before SPA fallback
src/
├── App.tsx
├── pwa.ts
├── pwa-register.stub.ts
├── Document.tsx
├── router.tsx
├── routeTree.gen.ts      # generated; do not edit
├── styles.css
├── routes/
│   ├── __root.tsx        # shell: skip link, header, Outlet, #main
│   ├── index.tsx         # calculator
│   ├── compare.tsx
│   ├── explore.tsx
│   └── saved.tsx
├── lib/
│   ├── site.ts
│   ├── gear/             # pure math; no framework imports
│   │   ├── types.ts
│   │   ├── wheels.ts
│   │   ├── calculations.ts
│   │   ├── skid.ts
│   │   └── chain.ts
│   ├── search.ts         # shared calculator search + compare tuples
│   ├── format.ts
│   ├── design-contracts.test.ts
│   └── state/
│       ├── setup-store.ts
│       ├── saved-store.ts
│       └── prefs-store.ts
└── components/
    ├── calculator/
    ├── skid/
    ├── compare/
    ├── explore/
    ├── saved/
    └── ui/
```

Tests sit next to the source they cover (`*.test.ts` / `*.test.tsx`).
Do not list every test file in the tree.

## State

Three tiers, in order of authority:

1. **URL search params** — the active drivetrain, on every route.
2. **Solid stores** — prefs and saved setups (draft-first).
3. **localStorage** — `fixie:prefs` and `fixie:saved`.

Derived metrics are never stored — they are `createMemo` computations.
Units and theme are not in the URL. Details:
[state and routing](state-and-routing.md).

## UI conventions

Native wrappers live in `src/components/ui/`: `Button`,
`SegmentedControl`, `ToothInput`, `CircumferenceInput`, `MetricCard`,
`CadenceTable`, `PresetChips`, `Tooltip`, `CopyLinkButton`,
`UnitToggle`, `ThemeToggle`.

Tokens in `src/styles.css`: `--color-accent` (`#FF5A1F`) for fills,
borders, and graphics; `--color-accent-ink` (`#C2410C`) for accent
text and outlines on paper. Accent-as-text is
`text-accent-ink dark:text-accent`. Text on an accent fill is
`text-ink`. See ADR-008.

The calculator (`/`) has one `sr-only` `aria-live="polite"` region;
metric cards are silent. The skip link goes to `#main`. The explore
heatmap must not use `role="grid"`, `role="row"`, or `role="gridcell"`
(ADR-009). `src/lib/design-contracts.test.ts` enforces accent-contrast
and focus-ring contracts.

## Testing and CI

```bash
pnpm test
pnpm typecheck
pnpm check
pnpm build    # emits dist/client
```

CI is `.github/workflows/ci.yml` (the same four commands). Lefthook
runs Biome on commit and Biome plus typecheck on push.
